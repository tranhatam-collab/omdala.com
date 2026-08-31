# OMDALA Cloudflare Infrastructure (Terraform)
# Phase 1: Core resources for autonomous backend platform.
# Requires: CLOUDFLARE_API_TOKEN environment variable.

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "zone_id" {
  description = "Cloudflare Zone ID for omdala.com"
  type        = string
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ------------------------------------------------------------------
# R2 Buckets
# ------------------------------------------------------------------
resource "cloudflare_r2_bucket" "backups" {
  account_id = var.account_id
  name       = "omdala-prod-backups"
}

resource "cloudflare_r2_bucket" "assets" {
  account_id = var.account_id
  name       = "omdala-prod-assets"
}

# ------------------------------------------------------------------
# KV Namespaces
# ------------------------------------------------------------------
resource "cloudflare_workers_kv_namespace" "cache" {
  account_id = var.account_id
  title      = "OMDALA Cache"
}

resource "cloudflare_workers_kv_namespace" "sessions" {
  account_id = var.account_id
  title      = "OMDALA Sessions"
}

# ------------------------------------------------------------------
# D1 Database (Phase 1 — read replicas only, not primary)
# ------------------------------------------------------------------
resource "cloudflare_d1_database" "metadata" {
  account_id = var.account_id
  name       = "omdala-metadata"
}

# ------------------------------------------------------------------
# Pages Project (Marketing)
# ------------------------------------------------------------------
resource "cloudflare_pages_project" "marketing" {
  account_id        = var.account_id
  name              = "omdala-marketing"
  production_branch = "main"
}

# ------------------------------------------------------------------
# Workers
# ------------------------------------------------------------------
resource "cloudflare_worker_script" "api" {
  account_id = var.account_id
  name       = "omdala-api"
  content    = file("${path.module}/../services/api-gateway/dist/worker.js")

  kv_namespace_binding {
    name        = "CACHE"
    namespace_id = cloudflare_workers_kv_namespace.cache.id
  }
}

# ------------------------------------------------------------------
# Hyperdrive
# ------------------------------------------------------------------
resource "cloudflare_hyperdrive_config" "postgres" {
  account_id = var.account_id
  name       = "omdala-postgres"
  origin     = {
    host = var.postgres_host
    port = 5432
    database = "omdala_prod"
    user = "omdala_app"
    password = var.postgres_password
  }
  caching = {
    disabled = false
    max_age = 30
  }
}

# ------------------------------------------------------------------
# DNS Records
# ------------------------------------------------------------------
resource "cloudflare_record" "api" {
  zone_id = var.zone_id
  name    = "api"
  type    = "CNAME"
  value   = "omdala-api.${var.account_id}.workers.dev"
  proxied = true
}

resource "cloudflare_record" "auth" {
  zone_id = var.zone_id
  name    = "auth"
  type    = "CNAME"
  value   = cloudflare_pages_project.marketing.subdomain
  proxied = true
}

# ------------------------------------------------------------------
# Outputs
# ------------------------------------------------------------------
output "r2_backup_bucket" {
  value = cloudflare_r2_bucket.backups.name
}

output "hyperdrive_id" {
  value = cloudflare_hyperdrive_config.postgres.id
}

output "api_worker_url" {
  value = "https://omdala-api.${var.account_id}.workers.dev"
}
