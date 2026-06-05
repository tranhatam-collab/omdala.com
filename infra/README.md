# OMDALA Autonomous Backend Platform

> **Repo:** `omdala.com/infra/`  
> **Subdomain:** `infra.omdala.com`  
> **Status:** P0 — Foundation  
> **Date:** 2026-06-05  
> **Owner:** OMDALA Infrastructure Team  
> **Auditor:** Cascade AI (Chief Infrastructure Architect)

---

## 9 Principles (Immutable)

1. **No single vendor lock-in.** Multi-cloud ready, vendor-agnostic core.
2. **No secrets in git.** Vault only. `git-secrets` + pre-commit hook enforced.
3. **No production deploy without approval.** PR + 2 reviewers + Founder veto.
4. **No data deletion without evidence.** Soft-delete + audit log + 30-day grace.
5. **Backup is not backup until restore test passes.** Weekly automated restore verification.
6. **Every action has evidence.** Immutable logs in `evidence_logs` table.
7. **Every service has a health endpoint.** `/health` returns 200 + git hash + timestamp.
8. **Every automated task has log, retry, alert.** DLQ after 3 retries, alert to admin.
9. **Production destructive actions require approval gate.** Delete DB, rotate secret, restore prod, change DNS, GDPR delete.

---

## Scope

Serve as sovereign backend for:

| System | Current Dependency | Target |
|--------|-------------------|--------|
| `computer.iai.one` | Supabase Auth + DB | Keycloak + PostgreSQL |
| `aiagent.iai.one` | Supabase + Render Workers | Agent Control Plane + pgvector |
| `maytinhai.org` | Cloudflare Workers + D1 | Hybrid: CF + infra auth bridge |
| `maytinhai.com` | Cloudflare Pages + Workers | Hybrid: CF + infra auth bridge |
| `tranhatam.com` | Cloudflare Workers + D1 | Hybrid: CF + infra auth bridge |
| `aiaccountingloop.com` | Multiple workers + D1 | Consolidate via infra gateway |

---

## Architecture

```
infra.omdala.com
├── api.infra.omdala.com          API Gateway (Caddy + Node/Python)
├── auth.infra.omdala.com         Keycloak 25 (OAuth2/OIDC)
├── db.infra.omdala.com           PostgreSQL 17 (private, no public)
├── storage.infra.omdala.com      MinIO + R2 fallback
├── cache.infra.omdala.com        Valkey (sessions, queues, rate limits)
├── queue.infra.omdala.com        BullMQ / custom over Valkey
├── jobs.infra.omdala.com         Worker fleet
├── monitor.infra.omdala.com      Uptime Kuma + Grafana + Loki
├── admin.infra.omdala.com        Admin console (IP-whitelist)
├── backup.infra.omdala.com       Backup portal (approval-gated)
└── vault.infra.omdala.com        HashiCorp Vault (secrets)
```

**Network tiers:**
- **Public:** `api`, `auth`, `storage` (read-only buckets)
- **Protected:** `admin`, `backup`, `monitor` (VPN or IP-whitelist)
- **Private:** `db`, `cache`, `queue`, `vault` (internal Docker only)

---

## P0-P100 Roadmap

| Phase | Goal | Week | Gate |
|-------|------|------|------|
| P0 | Audit repo/domain/DNS | 1 | `curl https://infra.omdala.com/health` → 200 |
| P1 | Architecture design | 1 | C4 diagrams + network topology approved |
| P2 | Repo structure | 1 | `omdala.com/infra/` has README, .env.example, compose |
| P3 | Docker Compose base | 1 | `docker compose up` brings up Caddy + health |
| P4 | PostgreSQL + backup R2 | 2 | pg_dump daily, WAL-G weekly, **restore test passes** |
| P5 | API Gateway | 3 | `/health` < 100ms p95, JWT verification, audit log |
| P6 | Worker queue | 3–4 | BullMQ active, 3 job types, DLQ + alert |
| P7 | Monitoring | 4 | Uptime Kuma + Grafana, alert on anomaly |
| P8 | Auth (Keycloak) | 4–5 | Realm OMDALA, OAuth clients registered |
| P9 | Agent Control Plane | 5–6 | Task schema, approval gates, evidence logs |
| P10 | Migration plan | 6 | Step-by-step Supabase/Render → infra |

---

## Team Assignments

| Team | Scope | Lead | Deliverable |
|------|-------|------|-------------|
| A — Infra | VPS, DNS, Docker, Caddy, firewall | DevOps | P0, P3 |
| B — Database | PostgreSQL, pgvector, backup, restore | DBA | P4 |
| C — Auth | Keycloak, OAuth, tenant roles | Security | P8 |
| D — API/Worker | API Gateway, workers, queues | Backend | P5, P6 |
| E — Agent OS | Agent control plane, task schema | AI Engineer | P9 |
| F — Monitoring | Uptime, Grafana, alerts | SRE | P7 |

---

## Approval Gates (Immutable)

These actions **ALWAYS** require GitHub PR (2 reviewers) + Founder approval:

- Delete database / table
- Restore production database
- Rotate production secrets
- Deploy to production
- Change DNS records
- Remove user data (GDPR delete)
- Open new firewall ports
- Scale VPS up/down

---

## Estimated Cost

| Item | Monthly |
|------|---------|
| Hetzner CX42 (8vCPU/16GB) | €15–20 |
| Cloudflare R2 (storage + egress) | $5–15 |
| Backblaze B2 (backup) | $5 |
| **Total** | **€25–40 (~$30–50)** |

---

## Quick Start

```bash
git clone git@github.com:tranhatam/omdala.com.git
cd omdala.com/infra
./scripts/bootstrap.sh --domain infra.omdala.com --email admin@omdala.com
```

## Health Check

```bash
./scripts/health-check.sh
```

## Backup Now

```bash
./scripts/backup-now.sh
```

## Restore Test

```bash
./scripts/restore-test.sh
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-05  
**Review Cycle:** Weekly until P5, then monthly.
