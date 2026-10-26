# Deployment Guide

> **Scope:** Deploying OMDALA infrastructure to production  
> **Warning:** Requires Founder approval for production deploys.

---

## Pre-Deploy Checklist

- [ ] P0 inventory complete and committed
- [ ] All secrets in Cloudflare Secrets Store (no `.env` in production)
- [ ] CI/CD pipeline green (lint, test, build, schema validate)
- [ ] Restore test passed within last 7 days
- [ ] Approval gate PR merged (2 reviewers + Founder)

---

## Server Requirements

| Spec | Minimum | Recommended |
|------|---------|-------------|
| CPU | 4 vCPU | 8 vCPU |
| RAM | 8 GB | 16 GB |
| Disk | 80 GB NVMe | 160 GB NVMe |
| OS | Ubuntu 24.04 LTS | Debian 12 |
| Network | 1 Gbps | 10 Gbps |

**Provider:** Hetzner CX42 (Germany or Singapore)

---

## Initial Setup (One-Time)

### 1. Provision VPS

```bash
# Via Hetzner Cloud Console or hcloud CLI
hcloud server create --name omdala-infra --type cx42 --image ubuntu-24.04 --location nbg1
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
make health
./scripts/restore-test.sh
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

The current source intentionally fails the DB bootstrap preflight before Docker starts: the init SQL references `omdala_prod`, contains literal password placeholders, and requests pgvector from an image without verified extension support. Team 2 and Infra must review the database initialization and image, then rerun the gate. Do not bypass it to start staging.

The staging env template lists the active Compose inputs, including scoped mail, AIAGENT release pins, receipt keys, and alert sink. The preflight rejects blanks, template placeholders, production AI mode, and non-HTTPS mail/R2/alert URLs. The worker requires `NODE_ENV` to be explicitly `staging` or `production`; in staging it rejects a mail job unless the recipient equals `EMAIL_STAGING_SINK_ADDRESS`, the sender equals `EMAIL_FROM`, and the endpoint/key are explicitly configured. These source checks do not establish provider ownership, secret scope, live sink delivery, or deployment identity; retain separate receipts for those gates.

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
./scripts/health-check.sh
./scripts/restore-test.sh
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
| Vertical | Upgrade VPS | Hetzner console → rescale |
| Multi-node | Docker Swarm | See ARCHITECTURE.md Phase 2 |

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-05
