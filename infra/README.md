# OMDALA Autonomous Backend Platform v2

> **Repo:** `omdala.com/infra/`  
> **Subdomain:** `infra.omdala.com`  
> **Status:** P0 — Cloudflare Inventory (MUST COMPLETE BEFORE BUILD)  
> **Date:** 2026-06-05  
> **Owner:** OMDALA Infrastructure Team  
> **Auditor:** Cascade AI (Chief Infrastructure Architect)  
> **Audit Score:** Vision 95/100, Architecture 82/100, Execution Safety 76/100, Cost Efficiency 80/100, Fit Existing Resources 70/100 → **Target after fix: 92/100**

---

## 9 Principles (Immutable) — v2

1. **Cloudflare-first, not VPS-first.** Edge handles traffic; VPS handles sovereign core only.
2. **No secrets in git.** Phase 1: GitHub Actions Secrets + Cloudflare Secrets Store + SOPS. Phase 2+: Vault production.
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
| `computer.iai.one` | Supabase Auth + DB | PostgreSQL-sovereign + Cloudflare Workers |
| `aiagent.iai.one` | Supabase + Render Workers | Agent Control Plane + pgvector + CF Workers |
| `maytinhai.org` | Cloudflare Workers + D1 | Keep CF, add sovereign PostgreSQL bridge |
| `maytinhai.com` | Cloudflare Pages + Workers | Keep CF, add sovereign PostgreSQL bridge |
| `tranhatam.com` | Cloudflare Workers + D1 | Keep CF, add sovereign PostgreSQL bridge |
| `aiaccountingloop.com` | Multiple workers + D1 | Consolidate via CF Workers + sovereign PostgreSQL |

---

## Architecture — Cloudflare-First + Sovereign Core

```
┌─────────────────────────────────────────────────────────┐
│  CLOUDFLARE EDGE (Public, Global)                       │
│  ├── Pages (~60 projects)                               │
│  ├── Workers (API Gateway, Auth Bridge, AI Gateway)     │
│  ├── R2 (Primary Object Storage)                        │
│  ├── Queues (19 queues — keep/merge/archive)            │
│  ├── KV (27 namespaces — audit/merge)                 │
│  ├── D1 (20 databases — inventory/migrate)              │
│  ├── Hyperdrive (1 active: omdala-postgres-f3f9)        │
│  ├── Secrets Store (production secrets)                 │
│  └── AI Gateway / Browser Rendering (optional)         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  SOVEREIGN CORE (VPS, Private)                          │
│  ├── PostgreSQL 17 + pgvector (NO public DNS)          │
│  │   └── Access: Hyperdrive (CF Workers)               │
│  │   └── Access: Private network / VPN (VPS services) │
│  ├── Keycloak (if needed, or CF Access bridge)          │
│  ├── Agent Worker (n8n / Temporal for heavy tasks)     │
│  ├── Monitoring (Uptime Kuma + Grafana, VPN only)       │
│  └── Backup Engine (pg_dump + WAL-G → R2 + B2)         │
└─────────────────────────────────────────────────────────┘
```

### Private Network Rules
- **PostgreSQL:** NO public DNS (`db.infra.omdala.com` REMOVED). NO port 5432 exposed.
- **Access paths:**
  - Cloudflare Workers → Hyperdrive → PostgreSQL
  - VPS internal services → private Docker network → PostgreSQL
- **MinIO:** Dev / lab / cache ONLY. NOT production storage.
- **R2:** Primary object storage. Backblaze B2 as secondary copy.

---

## 3-Layer Roadmap (Revised)

### Layer 1: Inventory + Backup + Control Plane
**Goal:** Know what we have. Back it up. Control it.

| # | Task | Week | Gate |
|---|------|------|------|
| L1.1 | **P0: Cloudflare Inventory** | 1 | `CLOUDFLARE_INVENTORY_AND_MIGRATION_MAP_2026.md` complete |
| L1.2 | D1 export + R2 bucket inventory + KV export | 1 | `/backup-index.json` exists |
| L1.3 | Wrangler config snapshot | 1 | All `wrangler.toml` archived |
| L1.4 | PostgreSQL sovereign core setup | 2 | Hyperdrive connects, restore test passes |
| L1.5 | Backup automation (R2 + optional B2) | 2 | Daily pg_dump, weekly WAL-G |

### Layer 2: PostgreSQL + Agent Control Plane
**Goal:** Core database + AI agent infrastructure.

| # | Task | Week | Gate |
|---|------|------|------|
| L2.1 | PostgreSQL schema: tenants, users, projects | 3 | Row counts match export |
| L2.2 | Agent Control Plane schema | 3 | Task, run, tool_call, approval, evidence tables |
| L2.3 | Agent roles: Planner, Context, Code, DB, Deploy, Verifier, Reporter | 4 | Each role has isolated permissions |
| L2.4 | Model router + cost tracking | 4 | Per-tenant quota enforced |
| L2.5 | Approval gate system | 4 | Verifier required for destructive actions |

### Layer 3: Auth Bridge + App Migration
**Goal:** Gradual cutover, auth last.

| # | Task | Week | Gate |
|---|------|------|------|
| L3.1 | Auth bridge: Cloudflare Access / Keycloak / Auth.js | 5 | SSO works for 1 test app |
| L3.2 | Migrate `aiagent.iai.one` | 6–7 | Agent tasks run on sovereign core |
| L3.3 | Migrate `computer.iai.one` | 7 | Auth + DB on sovereign |
| L3.4 | Migrate `maytinhai.org` | 8 | Hybrid: CF Workers + sovereign DB |
| L3.5 | Migrate `tranhatam.com` | 8–9 | Auth bridge first, DB later |
| L3.6 | Migrate `aiaccountingloop.com` | 9–10 | Multi-worker consolidation |
| L3.7 | Decommission Supabase (after 30-day burn-in) | 11+ | Founder approval |

---

## Secret Management Phases

| Phase | Tool | When |
|-------|------|------|
| Phase 1 | GitHub Actions Secrets + Cloudflare Secrets Store + SOPS | Now — P5 |
| Phase 2 | HashiCorp Vault production mode (NOT dev mode) | P6–P8 |
| Phase 3 | Vault HA (Raft consensus, 3 nodes) | P9+ |

**Rule:** `.env` files only for local dev. Production uses Secrets Store only.

---

## Team Assignments (Revised)

| Team | Scope | Lead | Deliverable |
|------|-------|------|-------------|
| A — Inventory | Cloudflare audit, D1/R2/KV/Queue mapping | DevOps | P0 complete, `CLOUDFLARE_INVENTORY_AND_MIGRATION_MAP_2026.md` |
| B — Database | PostgreSQL sovereign core, pgvector, backup | DBA | L1.4 + L2.1 complete, restore test passes |
| C — Agent OS | Agent control plane, task schema, model router | AI Engineer | L2.2–L2.5 complete |
| D — Auth | Cloudflare Access bridge, Keycloak, OAuth | Security | L3.1 complete, SSO for test app |
| E — Migration | App-by-app cutover, rollback scripts | Backend | L3.2–L3.6 complete |
| F — Edge | CF Workers, Pages, Queues, monitoring | SRE | Uptime + latency + cost dashboards |

---

## Approval Gates (Immutable)

| Action | Required |
|--------|----------|
| Delete database / table | PR + 2 reviewers + Founder |
| Restore production DB | PR + 2 reviewers + Founder |
| Rotate production secrets | PR + 2 reviewers + Founder |
| Deploy production | PR + 2 reviewers |
| Change DNS | PR + 2 reviewers + Founder |
| GDPR delete | PR + 2 reviewers + Founder |
| Open firewall port | PR + 2 reviewers + Founder |
| **Decommission Supabase** | PR + 2 reviewers + Founder + 30-day burn-in |

---

## Estimated Cost (Revised)

| Layer | Item | Monthly |
|-------|------|---------|
| Edge | Cloudflare (existing — mostly within free/pro) | ~$0–20 |
| Storage | R2 (primary) + Backblaze B2 (backup copy) | ~$5–15 |
| Sovereign Core | Hetzner CX42 (PostgreSQL + Agent Worker) | €15–20 |
| Secrets | Cloudflare Secrets Store + SOPS | $0 |
| **Total** | | **€15–20 + $5–15 (~$25–40)** |

---

## Quick Start

### P0 — Inventory (MUST DO FIRST)

```bash
git clone git@github.com:tranhatam/omdala.com.git
cd omdala.com
# Read docs/ecosystem/CLOUDFLARE_INVENTORY_AND_MIGRATION_MAP_2026.md
# Complete the inventory BEFORE any infra build
```

### Layer 1 — Backup

```bash
cd omdala.com/infra
./scripts/backup-now.sh
./scripts/restore-test.sh  # MUST PASS
```

### Layer 2 — Agent Control Plane

```bash
# After PostgreSQL is running and restore test passes
docker compose up -d postgres valkey api-gateway worker
./scripts/health-check.sh
```

---

**Document Version:** 2.0 (Post-Audit)  
**Last Updated:** 2026-06-05  
**Review Cycle:** Weekly until L2, then monthly  
**Next Gate:** P0 inventory complete → Founder sign-off → L1 build

