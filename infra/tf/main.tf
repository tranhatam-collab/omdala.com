# OMDALA Cloudflare Infrastructure (Terraform)
# Phase 1: Core resources for autonomous backend platform.
# Requires: CLOUDFLARE_API_TOKEN environment variable.

terraform {
  required_version = ">= 1.10.0, < 2.0.0"

  backend "s3" {
    bucket                      = "omdala-terraform-state"
    key                         = "omdala/production/terraform.tfstate"
    region                      = "auto"
    endpoints                   = { s3 = "https://f3f9e76222dcb488d5e303e29e8ba192.r2.cloudflarestorage.com" }
    use_lockfile                = true
    use_path_style              = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
  }

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

# Worker application code and routes are intentionally outside this Terraform
# state. `services/api/wrangler.toml` plus the protected OMDALA Release workflow
# are the only deployment authority for `omdala-api*`. Terraform remains the
# authority for durable infrastructure such as storage and Hyperdrive.

# ------------------------------------------------------------------
# Hyperdrive
# ------------------------------------------------------------------
resource "cloudflare_hyperdrive_config" "postgres" {
  account_id = var.account_id
  name       = "omdala-postgres-f3f9"
  origin = {
    host     = var.postgres_host
    port     = 5432
    scheme   = "postgresql"
    database = "omdala_prod"
    user     = "omdala_api"
    password = var.postgres_password
  }
  caching = {
    disabled = true
  }
}

resource "cloudflare_hyperdrive_config" "postgres_staging" {
  account_id = var.account_id
  name       = "omdala-postgres-staging-f3f9"
  origin = {
    host     = var.staging_postgres_host
    port     = 5432
    scheme   = "postgresql"
    database = "omdala_staging"
    user     = "omdala_staging"
    password = var.staging_postgres_password
  }
  caching = {
    disabled = true
  }
}

# API custom-domain ownership is declared in `services/api/wrangler.toml` and
# applied by the protected release workflow together with the exact Worker
# version. Keeping the route here would create a second writer.

# All surface Pages projects and custom domains belong to the protected
# surface-release lane. The obsolete `omdala-marketing` project declaration was
# removed so Terraform cannot become a second writer for Web/App/Auth/Brand.

# ------------------------------------------------------------------
# Outputs
# ------------------------------------------------------------------
output "r2_backup_bucket" {
  value = cloudflare_r2_bucket.backups.name
}

output "hyperdrive_id" {
  value = cloudflare_hyperdrive_config.postgres.id
}

output "staging_hyperdrive_id" {
  value = cloudflare_hyperdrive_config.postgres_staging.id
}

output "api_deployment_authority" {
  value = "wrangler:services/api/wrangler.toml"
}

output "surface_deployment_authority" {
  value = "github-actions:.github/workflows/deploy-surfaces.yml"
}
