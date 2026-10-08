variable "cloudflare_api_token" {
  description = "Cloudflare API Token with Zone:Edit, Account:Edit permissions"
  type        = string
  sensitive   = true
}

variable "postgres_host" {
  description = "Existing production PostgreSQL hostname imported into Hyperdrive state"
  type        = string
  default     = "mail.iai.one"
}

variable "postgres_password" {
  description = "Existing omdala_api production PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "staging_postgres_host" {
  description = "Distinct staging PostgreSQL hostname; must be provider-reachable and must not resolve to the production database"
  type        = string
}

variable "staging_postgres_password" {
  description = "Password for the isolated omdala_staging PostgreSQL user"
  type        = string
  sensitive   = true
}
