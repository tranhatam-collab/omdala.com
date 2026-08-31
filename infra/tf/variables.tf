variable "cloudflare_api_token" {
  description = "Cloudflare API Token with Zone:Edit, Account:Edit permissions"
  type        = string
  sensitive   = true
}

variable "postgres_host" {
  description = "PostgreSQL host (private IP or hostname)"
  type        = string
  default     = "postgres.omdala.internal"
}

variable "postgres_password" {
  description = "PostgreSQL app user password"
  type        = string
  sensitive   = true
}
