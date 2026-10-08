# OMDALA API Worker state handoff

`services/api/wrangler.toml` and the protected `OMDALA Release` workflow are
the only application deployment authority for `omdala-api` and
`omdala-api-staging`. Terraform continues to own durable resources.

Before applying this Terraform change against any existing state:

1. Use a Terraform CLI version allowed by `required_version` and the exact
   Cloudflare provider selected in `.terraform.lock.hcl`. This candidate was
   validated with Terraform `1.15.7` and Cloudflare provider `4.52.9`.
2. Configure bucket-scoped R2 `AWS_ACCESS_KEY_ID` and
   `AWS_SECRET_ACCESS_KEY`, initialize the declared `omdala-terraform-state`
   backend with migration enabled, verify `.tflock` contention using two
   concurrent read-only plans, then back up the exact remote state and record
   its SHA-256. Never place the R2 keys in a backend config file or plan.
3. Run `terraform state list` and determine whether any of
   `cloudflare_worker_script.api`, `cloudflare_record.api`, or
   `cloudflare_record.auth` is present. Also inspect
   `cloudflare_pages_project.marketing`; the obsolete `omdala-marketing`
   declaration is no longer a valid deployment authority.
4. If present, remove only those addresses from Terraform state with
   `terraform state rm`, including `cloudflare_pages_project.marketing` when it
   is present. This is a state ownership transfer; it must not call
   `terraform destroy` or delete a Cloudflare resource. The Auth record must
   first be attached to the dedicated Auth Pages project and read back through
   Cloudflare so this transfer cannot strand the hostname.
5. Reconcile the existing production Hyperdrive before planning. Read-only
   provider evidence on 2026-10-08 identified account
   `f3f9e76222dcb488d5e303e29e8ba192`, Hyperdrive
   `b9c4907f49ca48cc9ee489013c3aa033`, name
   `omdala-postgres-f3f9`, origin `mail.iai.one:5432/omdala_prod`, user
   `omdala_api`, scheme `postgresql`, caching disabled. Import that exact
   provider object into `cloudflare_hyperdrive_config.postgres`; never allow
   Terraform to create a second production Hyperdrive.
6. Provision the distinct `omdala_staging` database and `omdala_staging` role
   first, then create `cloudflare_hyperdrive_config.postgres_staging`. Its host,
   database, user, password and ID must differ from production. Store each
   resulting ID as the protected environment variable
   `OMDALA_HYPERDRIVE_ID` in its matching GitHub environment.
7. Run `terraform plan` and require zero Worker, route, DNS, database, KV, R2,
   Pages, or Hyperdrive destroys before apply.
8. Read back the Worker version, exact Hyperdrive binding, route and API custom
   domain through Wrangler,
   plus each surface custom domain through Cloudflare Pages, and bind them to
   the same release SHA in the deployment receipt.

Do not apply from a local or unknown state file. A shared remote backend and
state lock are required before this directory becomes an active authority.
