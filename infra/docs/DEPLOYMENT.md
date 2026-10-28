# Deployment Guide

> **Scope:** Deploying OMDALA infrastructure to production  
> **Warning:** Requires Founder approval for production deploys.

> **Restore gate HOLD:** `./scripts/restore-test.sh` is disabled. The old script
> targeted `omdala-postgres` from a shared `.env` and could claim success from
> a `public` table count. Replace it with an approved isolated scratch restore
> and independently reviewed parity receipt before any release decision.
>
> **Queue deploy gate HOLD:** the background worker's legacy `deploy` job is
> disabled and always fails closed. It must not execute Git, Docker, Wrangler,
> SSH, or branch input from queue data. Use only the reviewed protected
> exact-SHA staging or production transaction after its required approvals.

---

## Pre-Deploy Checklist

- [ ] P0 inventory complete and committed
- [ ] All secrets in Cloudflare Secrets Store (no `.env` in production)
- [ ] CI/CD pipeline green (lint, test, build, schema validate)
- [ ] Restore test passed within last 7 days
- [ ] Approval gate PR merged (2 reviewers + Founder)

### Staging browser configuration preflight

After installing the locked workspace dependencies, run from the repository root:

```bash
node --test scripts/playwright-staging-loader.test.mjs
```

This uses the installed Playwright loader with `--list` and synthetic configuration
to discover exactly four scenarios without executing them or contacting staging.
It also verifies that missing staging origins and output paths inside the candidate
are rejected. CI runs it in App Playwright E2E after dependency installation; the
dependency-free release governance job must not require Playwright.

The staging config is loaded as CommonJS by Playwright, so its policy receives a
file URL derived from `__dirname`, not `import.meta.url`. Real staging acceptance
still requires the protected environment, actual deployment identities, scoped
test credentials, external artifact paths, and independent acceptance receipts.

---

## Server Requirements

| Spec | Minimum | Recommended |
|------|---------|-------------|
| CPU | 4 vCPU | 8 vCPU |
| RAM | 8 GB | 16 GB |
| Disk | 80 GB NVMe | 160 GB NVMe |
| OS | Ubuntu 24.04 LTS | Debian 12 |
| Network | 1 Gbps | 10 Gbps |

**Provider:** DigitalOcean for the staging pilot. Production provider and capacity require a separate approved packet.

---

## Initial Setup (One-Time)

### 1. Provision VPS

```bash
# Staging DigitalOcean resource already has a separate identity receipt.
# Verify the approved project, Droplet, VPC, firewall, and cost owner before use.
# Do not provision or change a production host from this guide.
```

### 2. DNS Configuration

In Cloudflare Dashboard:

| Record | Type | Target | Proxy |
|--------|------|--------|-------|
| `infra.omdala.com` | A | `<VPS_IP>` | Yes |
| `api.infra.omdala.com` | CNAME | `infra.omdala.com` | Yes |
| `auth.infra.omdala.com` | CNAME | `infra.omdala.com` | Yes |
| `monitor.infra.omdala.com` | CNAME | `infra.omdala.com` | Yes |

### 3. Bootstrap Server

```bash
git clone git@github.com:tranhatam/omdala.com.git
cd omdala.com/infra
./scripts/bootstrap.sh --domain infra.omdala.com --email admin@omdala.com
```

This script installs Docker, configures firewall, and creates directories.

### 4. Deploy Secrets

```bash
# Production secrets are NEVER in git.
# Use Cloudflare Secrets Store or SOPS-encrypted files.

# Option A: Cloudflare Wrangler
wrangler secret put POSTGRES_PASSWORD
wrangler secret put R2_ACCESS_KEY_ID
# ... etc

# Option B: SOPS (Phase 1)
sops -d secrets/production.enc.env > .env
```

### 5. Start Services

```bash
# Production (no override)
docker compose up -d

# Verify
INFRA_ENVIRONMENT=production INFRA_DOMAIN=infra.omdala.com make health
# Restore gate remains HOLD until an isolated scratch restore receipt exists.
```

---

## Staging Deploy

```bash
# Copy staging env
cp .env.staging.example .env.staging
# Edit .env.staging with staging values

# Run the staging identity and DB bootstrap preflights, then use the staging env file directly.
# This does not replace the production .env file.
make staging-up
```

The current source intentionally fails the DB bootstrap preflight before Docker starts: the init SQL references `omdala_prod`, contains literal password placeholders, requests pgvector from an image without verified extension support, and automatically loads a local-development demo seed into the staging database. That seed also creates a `deploy_production` approval request. Team 2 and Infra must review the database initialization, image, and staging fixture policy, then rerun the gate. Do not bypass it to start staging.

An additional staging edge/Auth preflight blocks Keycloak `start-dev` inherited from the base Compose file and Caddy `auto_https off` without a reviewed TLS replacement. These are source hazards, not proof of an HTTP exposure or a deployed Auth instance. Infra and Team 2 must approve the Keycloak production-mode settings and TLS termination/redirect topology, then verify both at runtime before staging E2E.

The staging env template lists the active Compose inputs, including scoped mail, AIAGENT release pins, receipt keys, and alert sink. The preflight rejects blanks, template placeholders, production AI mode, and non-HTTPS mail/R2/alert URLs. The worker requires `NODE_ENV` to be explicitly `staging` or `production`; in staging it rejects a mail job unless the recipient equals `EMAIL_STAGING_SINK_ADDRESS`, the sender equals `EMAIL_FROM`, and the endpoint/key are explicitly configured. These source checks do not establish provider ownership, secret scope, live sink delivery, or deployment identity; retain separate receipts for those gates.

Run `staging-up` only on the approved staging host with its local Docker daemon. The env preflight rejects nonempty `DOCKER_HOST` and `DOCKER_CONTEXT` so an inherited shell setting cannot redirect the command. This check does not attest the host, daemon, firewall, or Docker context configuration; collect those readbacks before any protected deployment.

---

## Production Deploy

### Automated (CI/CD)

On merge to `main`:

```bash
# GitHub Actions: .github/workflows/deploy-production.yml
# 1. Build images
# 2. Push to registry (optional)
# 3. SSH to VPS
# 4. Pull latest
# 5. docker compose up -d
# 6. Run health check
# 7. Notify Slack
```

### Manual (Emergency)

```bash
# 1. SSH to VPS
ssh admin@infra.omdala.com

# 2. Pull latest code
cd /opt/omdala-infra
git fetch origin main
git checkout origin/main

# 3. Apply secrets (from Vault/Secrets Store)
# ...

# 4. Deploy
docker compose up -d --build

# 5. Verify
INFRA_ENVIRONMENT=production INFRA_DOMAIN=infra.omdala.com ./scripts/health-check.sh
# Restore gate remains HOLD until an isolated scratch restore receipt exists.
```

---

## Rollback

```bash
# Identify last known good commit
git log --oneline -10

# Rollback to previous commit
git checkout <commit-hash>
docker compose up -d --build

# Or revert specific service
docker compose pull api-gateway
docker compose up -d api-gateway
```

---

## Monitoring After Deploy

| Metric | Check | Tool |
|--------|-------|------|
| API health | `/health` returns 200 | curl |
| API latency | p95 < 100ms | Grafana |
| DB connections | < 80% max | Grafana |
| Worker queue | No stalled jobs | Uptime Kuma |
| Backup | Last backup < 24h | R2 bucket |

---

## Scaling

| Phase | Action | Command |
|-------|--------|---------|
| Horizontal | Add worker replicas | `docker compose up -d --scale worker=3` |
| Vertical | Upgrade VPS | Provider console only after capacity review and approval |
| Multi-node | Docker Swarm | See ARCHITECTURE.md Phase 2 |

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-05
