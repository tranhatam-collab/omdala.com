# OMDALA Infra Architecture v2 (P1) — Cloudflare-First + Sovereign Core

> **Status:** DESIGN APPROVED (Post-Audit)  
> **Date:** 2026-06-05  
> **Author:** Chief Infrastructure Architect (Cascade AI)  
> **Audit Score Target:** 92/100  
> **Review:** Founder approval required before any build

---

## C4 Level 1 — System Context

```
┌─────────────────────────────────────────────────────────┐
│  CLOUDFLARE EDGE (Global, Public)                       │
│  ├── End Users (Web / App / Mobile)                     │
│  ├── AI Agents (Planner, Code, Deploy, Verifier)         │
│  └── Admins (DevOps / Security)                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Services                                    │
│  ├── Pages (~60 projects — audit: keep/merge/archive)  │
│  ├── Workers (API Gateway, Auth Bridge, AI Gateway)      │
│  ├── R2 (Primary Object Storage)                        │
│  ├── Queues (19 queues — audit: keep/merge/archive)      │
│  ├── KV (27 namespaces — audit: keep/merge)            │
│  ├── D1 (20 databases — inventory/migrate)               │
│  ├── Hyperdrive (1 active → PostgreSQL sovereign)      │
│  ├── Secrets Store (Production secrets — Phase 1)      │
│  └── AI Gateway / Browser Rendering (optional)           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  SOVEREIGN CORE (VPS, Private)                         │
│  ├── PostgreSQL 17 + pgvector (NO public DNS)           │
│  │   └── Access: Hyperdrive (CF Workers)                │
│  │   └── Access: Private Docker network (VPS services)  │
│  ├── Keycloak (if needed, or CF Access bridge)          │
│  ├── Agent Worker (n8n / Temporal for heavy tasks)      │
│  ├── Monitoring (Uptime Kuma + Grafana, VPN only)     │
│  └── Backup Engine (pg_dump + WAL-G → R2 + optional B2) │
└─────────────────────────────────────────────────────────┘
```

---

## C4 Level 2 — Containers

```
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Edge                                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │  Pages  │  │ Workers │  │  R2     │  │ Queues  │   │
│  │  (60)   │  │ (API)   │  │ (18)    │  │ (19)    │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │   KV    │  │   D1    │  │Hyperdrive│  │ Secrets │   │
│  │  (27)   │  │  (20)   │  │  (1)    │  │ Store   │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Hyperdrive (private TCP)
                          ▼
┌─────────────────────────────────────────────────────────┐
│  VPS — Sovereign Core (Single-node, Docker Compose)     │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Caddy (Reverse Proxy + TLS)                    │    │
│  │  ┌────────┐  ┌────────┐  ┌────────┐           │    │
│  │  │ API GW │  │  Auth  │  │ Monitor│           │    │
│  │  └────────┘  └────────┘  └────────┘           │    │
│  │       │                                     │    │
│  │  ┌────┴────┐  ┌────────┐  ┌────────┐         │    │
│  │  │PostgreSQL│  │ Valkey │  │ Backup │         │    │
│  │  │ (private)│  │ (queue)│  │ (R2+B2)│         │    │
│  │  └─────────┘  └────────┘  └────────┘         │    │
│  │                                              │    │
│  │  MinIO = dev/lab only (profile: dev)         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Network Topology

### Public Tier (Cloudflare Edge)
- **Pages** → ~60 projects, audit required
- **Workers** → API Gateway, Auth Bridge, AI Gateway
- **R2** → Primary object storage, public read-only buckets
- **Queues** → 19 queues, audit/merge/archive

### Protected Tier (VPS, VPN or IP-whitelist)
- **Admin Console** → `admin.infra.omdala.com` (VPN only)
- **Monitoring** → `monitor.infra.omdala.com` (Basic Auth + IP-whitelist)
- **Backup Portal** → Approval-gated access

### Private Tier (NO public ingress)
- **PostgreSQL** → NO `db.infra.omdala.com`. NO port 5432 exposed. Access via Hyperdrive or internal Docker network.
- **Valkey** → Internal Docker network only
- **MinIO** → Internal Docker network, `profiles: ["dev","lab"]` only

---

## Data Flow — API Request (Cloudflare Workers)

```
1. User → Cloudflare Workers (api.infra.omdala.com)
2. Worker → JWT verification (Keycloak public key cached in KV)
3. Worker → Tenant routing (X-Tenant-ID header)
4. Worker → Hyperdrive → PostgreSQL (private TCP)
5. Worker → Valkey (via internal network or CF cache)
6. Worker → R2 (signed URL or direct write)
7. Worker → Audit log (async write via Queue → Worker → PostgreSQL)
8. Response → Cloudflare CDN → User
```

## Data Flow — API Request (VPS Internal)

```
1. Internal service → Caddy (internal:80)
2. Caddy → API Gateway (internal:3000)
3. API Gateway → JWT verification (Keycloak)
4. API Gateway → PostgreSQL (private Docker network)
5. API Gateway → Valkey (private Docker network)
6. Response → Caddy
```

---

## Data Flow — Background Job

```
1. API Gateway pushes job to Valkey queue (BullMQ)
2. Worker polls Valkey, picks up job
3. Worker executes:
   - DB query → PostgreSQL (via private network)
   - File upload → R2 (via S3 API)
   - Email send → mail.iai.one (via HTTPS)
4. Worker writes result to PostgreSQL
5. Worker pushes success/failure to audit log
6. On failure: retry 3x, then move to DLQ + alert
```

---

## Approval Gate Architecture

```
Destructive Action Request
         │
         v
┌─────────────────┐
│ Admin Portal    │  (VPN-only, admin.infra.omdala.com)
└─────────────────┘
         │
         v
┌─────────────────┐
│ GitHub PR       │  2 reviewers + Founder veto
└─────────────────┘
         │
         v
┌─────────────────┐
│ Evidence Log    │  Immutable entry in PostgreSQL
│ (evidence_logs) │  Signed, tamper-evident
└─────────────────┘
         │
         v
┌─────────────────┐
│ Execution         │  Only after all gates pass
│ (logged + alert)  │  Every action logged to audit_logs
└─────────────────┘
```

---

## Technology Decisions (Revised)

| Layer | Decision | Choice | Rationale |
|-------|----------|--------|-----------|
| Edge | Pages/Workers | Cloudflare (existing) | ~60 projects already deployed, global edge |
| Edge | Object Storage | R2 (primary) | Cheaper egress than S3, integrated with CF |
| Edge | Queue | CF Queues (existing 19) | Audit first, keep/merge/archive |
| Edge | Cache | KV (existing 27) | Audit first, merge duplicates |
| Edge | Database Bridge | Hyperdrive | Existing `omdala-postgres-f3f9`, connects CF Workers to private PostgreSQL |
| Sovereign Core | VPS | Hetzner CX42 | PostgreSQL + Agent Worker only |
| Sovereign Core | Reverse Proxy | Caddy | Auto HTTPS, simple config |
| Sovereign Core | Database | PostgreSQL 17 + pgvector | Core replacement for Supabase |
| Sovereign Core | Auth | Keycloak 25 (optional) | Or Cloudflare Access bridge first |
| Sovereign Core | Cache/Queue | Valkey 8 | Better OSS license than Redis 7.4+ |
| Sovereign Core | Worker | Node.js 22 + BullMQ | Familiar stack |
| Sovereign Core | Monitoring | Uptime Kuma + Grafana | VPN-only access |
| Sovereign Core | Backup | pg_dump + WAL-G → R2 + optional B2 | Primary R2, secondary B2 |
| Secrets | Phase 1 | GitHub Actions + CF Secrets Store + SOPS | No Vault dev mode in production |
| Secrets | Phase 2+ | Vault production mode (Raft) | HA when multi-node |

---

## Secret Management Phases

| Phase | Tool | Scope | When |
|-------|------|-------|------|
| Phase 1 | GitHub Actions Secrets + Cloudflare Secrets Store + SOPS | Production secrets | Now — P5 |
| Phase 2 | HashiCorp Vault production mode (Raft, NOT dev) | Multi-tenant secrets | P6–P8 |
| Phase 3 | Vault HA (3-node consensus) | Enterprise scale | P9+ |

**Rule:** No `VAULT_TOKEN=<root>` in `.env`. Vault dev mode is FORBIDDEN in production.

---

## Scaling Path

| Phase | Scale | Architecture |
|-------|-------|------------|
| P0–P2 | Single VPS + CF Edge | Docker Compose, single-node, CF Workers global |
| P3–P5 | Single VPS + CF Edge | Worker replicas, CF Pages + Workers stable |
| P6–P8 | Multi-node VPS + CF Edge | Docker Swarm or k3s, replicated PostgreSQL |
| P9+ | Multi-region | Caddy + Anycast + geo-distributed PostgreSQL |

---

## Risk Mitigation (Revised)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| VPS downtime | Medium | High | Daily backup to R2; Hyperdrive reconnects automatically |
| Keycloak misconfig | Medium | High | Realm export before changes; test realm; CF Access bridge fallback |
| Data corruption | Low | Critical | Parallel running; checksum validation; 30-day rollback window |
| Secret leak | Low | Critical | `git-secrets`, SOPS, CF Secrets Store; quarterly rotation |
| Single point of failure | High | High | Phase 2: Docker Swarm; Phase 3: multi-region |
| Supabase decommission too early | Medium | High | 30-day burn-in; keep Supabase read-only before cut |
| Cloudflare lock-in | Medium | Medium | PostgreSQL sovereign core; R2 → B2 backup; always portable |

---

**Next:** P0 — Cloudflare Inventory → `../../docs/ecosystem/CLOUDFLARE_INVENTORY_AND_MIGRATION_MAP_2026.md`
