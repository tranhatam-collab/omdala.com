# ADR draft — OMDALA shared staging on DigitalOcean, Cloudflare and Vercel

- **Date:** 2026-10-26 (Asia/Ho_Chi_Minh)
- **Status:** `PROPOSED_PENDING_FOUNDER_TEAM2_TEAM4`
- **Source base:** `7b423200dd8776f1e7203e28aef17ea68b10521a` on new `OMCODE/infra-e2e-auto-20261026` work branch
- **Scope:** staging architecture and resource authority only; no production topology change, memory data authority approval, deploy or purchase
- **Contracts:** `INFRA-01`, `INFRA-02`, `INFRA-05`, `INFRA-09`, `INFRA-11`, `INFRA-15`

## Decision to record

The user selected DigitalOcean and the existing Vercel account for shared staging, and excluded Hetzner. This draft proposes a DigitalOcean SGP1 core for OMDALA staging while retaining the source-declared Cloudflare Workers, D1 ledger, R2 and protected staging transaction. Vercel may host a frontend surface only after the owner proves that its release marker, Auth origin, noindex, isolation and rollback contract match the current Cloudflare surface workflow. This is not a decision to migrate any current OMDALA surface or any other consumer project.

The exact workload placement, database authority, data region, security reviewer and budget cap still require named approval. `ADR-TEAM2-WAVE0-DATA-AUTHORITY-2026-10-07.md` remains `PROPOSED_PENDING_FOUNDER_AND_TEAM4`; it recommends PostgreSQL through Hyperdrive for the main API and a separate Omniverse D1, but does not approve bindings or memory storage.

## Verified source declarations and external resource state

| Component | Source declaration at base SHA | Required staging evidence |
| --- | --- | --- |
| API | `services/api/wrangler.toml` defines `omdala-api-staging`, `api-staging.omdala.com`, separate staging workspace and sink mail mode. | Exact Worker version, route/DNS/TLS, release SHA, staging-only bindings and semantic deep health. |
| Frontend surfaces | `infra/staging/surfaces/` defines Web/App/Auth/Brand staging Workers; `.github/workflows/staging-transaction.yml` binds five surfaces to one protected transaction. | Per-surface release marker, origin, noindex and rollback receipt. Vercel mapping needs a reviewed workflow change before use. |
| Data | `infra/tf/main.tf` declares separate production and staging Hyperdrive configs, with `staging_postgres_host` as an origin host; source does not establish a route from Cloudflare to a private DigitalOcean VPC IP. | Single approved PostgreSQL authority, staging DB/role, migration hash, TLS and real query; D1 ledger separately reconciled. |
| DigitalOcean | Project `omdala-infra-staging` and SGP1 VPC `omdala-infra-staging-sgp1` (`10.104.16.0/20`). Provider readback at 2026-10-26 14:08 ICT found active Droplet `612646301` in that VPC, with daily backups enabled. | No DigitalOcean Cloud Firewall is assigned; SSH/2FA, host firewall, patch state, backup restore, DB isolation and cost ownership remain unverified. See readback below. |
| Vercel | Prior account readback showed an active Pro team, with no OMDALA project found in the team inspected. | Only attach a compatible frontend after a per-surface ADR, project/domain ownership, env scope, deploy ID and rollback readback. |

### DigitalOcean provider readback — 2026-10-26 14:08 ICT

The logged-in DigitalOcean team shows project `eab820d0-2dca-4ce1-85aa-e4861dcd6031`, VPC `bcfd3e33-b864-48c7-b4e0-7b5c7f193bf5`, and active Droplet `612646301` named `omdala-infra-staging-sgp1`. The Droplet is Ubuntu 24.04, Basic Intel 4 vCPU / 8 GB RAM / 240 GB disk in SGP1. Dashboard estimate: **$83.20/month or $0.124/hour**, not a billed invoice. It has a public IPv4 and private VPC address `10.104.16.2`.

Daily automated backups are enabled, with one backup listed from approximately 04:00 UTC; this is backup existence only, with no restore proof. The Networking panel says **no DigitalOcean Cloud Firewall assigned**. The Droplet has no tags. Host firewall rules, listening ports, SSH keys, 2FA, actual patch level, monitoring, DB service, and workload identity have not been checked. Do not infer an open database port solely from the missing cloud firewall. No new resource, access rule, backup, tag or connection was created in this readback.

## Private database connectivity gate

**Inference from the private-network design:** a `10.104.16.0/20` DigitalOcean VPC address is not by itself an origin that Cloudflare Hyperdrive can reach. The recommended candidate is **Cloudflare Workers VPC**: `cloudflared` runs in a network that can reach staging PostgreSQL, a TCP VPC Service points to its private address and port 5432, and staging Hyperdrive is configured with that service ID. This requires the relevant Cloudflare role and origin TLS/hostname verification; no database port is opened publicly. Cloudflare also documents a Tunnel + Access service-token path. The final path must be chosen after account feature/permission readback and a real TLS/query probe, then reflected in Terraform/resource ownership and the protected release workflow.

Sources: [Cloudflare private Hyperdrive with Workers VPC](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database-vpc/) and [Tunnel + Access alternative](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/). These documents describe connectivity mechanisms, not proof that either is configured in this account.

## Authority and isolation rules

1. DigitalOcean owner controls VPC, Droplet, firewall, OS, local DB and backup; Cloudflare owner controls zone, Tunnel/VPC Service, Hyperdrive, Worker, D1 and R2; GitHub repo admin controls protected environments; Vercel owner controls only approved frontend projects. Record named people and account/resource IDs without secrets in `INFRA-01`.
2. Wrangler plus the protected OMDALA Release workflow remains the only API Worker deploy authority. Terraform manages durable resources and outputs; require state lineage, lock and zero-destroy readback before modifying existing state. A Vercel deployment cannot silently replace a protected Cloudflare surface.
3. Separate staging database, DB roles, R2 bucket, D1 ledger, workspace and secrets from production. No production data, credential or fallback connection string in staging. Require negative cross-environment and cross-tenant tests.
4. Shared staging consumers receive separate tenant/data/secret/cost boundaries and their own acceptance. The DigitalOcean 4-vCPU/8-GB candidate is a pilot size, not capacity proof for all projects.
5. Memory/Vault runtime storage stays blocked on FDR data/memory/residency, L01 counsel, B04/B12 and versioned Computer/Om AI contracts. This ADR cannot supersede Computer Gen1's separate RDS/S3+R2 authority.

## Work order and acceptance sequence

| Gate | Work | Exit receipt |
| --- | --- | --- |
| A0 | Founder names owners, approves pilot/budget and reviews this ADR together with Team 2 data authority. | Signed decision, explicit scope and supersession map; current PR/CI/reviewer baseline. |
| A1 | Verify and harden the existing DigitalOcean staging host in the existing project/VPC: SSH/2FA, deny-by-default cloud and host firewalls, monitoring, tags, backup and restore; record only names/IDs. | Provider readback, no-public-DB proof, access roster, measured backup and isolated restore. |
| A2 | Establish Cloudflare-to-DO private PostgreSQL connection via the chosen Tunnel/VPC Service path and verified TLS. | Tunnel/service/Hyperdrive IDs, account scope, certificate mode, real query and negative production-binding proof. |
| A3 | Prepare protected Cloudflare staging-only resources, D1 ledger and five exact-SHA surfaces; Vercel only for any explicitly approved compatible surface. | Protected transaction capsule, deployment IDs, release markers, DNS/TLS and compensation receipts. |
| A4 | Team 4 independently tests Auth, tenant isolation, API/data/AI/mail, failure/recovery and rollback. | Exact-SHA `STAGING_ACCEPTED` or veto; complete E2E JSON, signed provider and restore receipts. |

**Stop conditions:** no signed data authority; unknown cloud account or Docker daemon; missing staging DB resource ID; public PostgreSQL exposure; TLS verification disabled without accepted risk; production binding or secret in staging; missing independent reviewer; restore or rollback failure. The current outcome is `HOLD / NO_GO` for release and `PROVISIONED_UNHARDENED` for the DigitalOcean Droplet; A1 remains open because no DigitalOcean Cloud Firewall is assigned and host/restore proof is missing.
