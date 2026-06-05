# OMDALA Infra Architecture (P1)

> **Status:** DESIGN APPROVED  
> **Date:** 2026-06-05  
> **Author:** Chief Infrastructure Architect (Cascade AI)  
> **Review:** Founder approval required before P3 execution

---

## C4 Level 1 — System Context

```
+------------------+     +------------------+     +------------------+
|   End Users      |     |   AI Agents      |     |   Admins         |
| (Web/App/Mobile) |     | (Planner/Code/   |     | (DevOps/Security)|
+------------------+     |  Deploy/Verifier) |     +------------------+
         |               +------------------+              |
         |                        |                       |
         v                        v                       v
+------------------+     +------------------+     +------------------+
|  api.infra.      |<--->|  agent-control   |     |  admin.infra.    |
|  omdala.com      |     |  .omdala.com     |     |  omdala.com      |
+------------------+     +------------------+     +------------------+
         |
         v
+------------------+
|  auth.infra.     |
|  omdala.com      |  Keycloak (OAuth2/OIDC)
+------------------+
         |
         v
+------------------+
|  infra.omdala.com|
|  Internal Stack  |
+------------------+
```

---

## C4 Level 2 — Containers

```
+------------------+
|  Caddy           |  Reverse Proxy + TLS (public ingress)
+------------------+
         |
    +----+----+
    |         |
    v         v
+------+  +------+
| API  |  | Auth |
| GW   |  | KC   |
+------+  +------+
    |
    v
+------------------------------------------+
|  Private Network (Docker internal)       |
|                                            |
|  +--------+  +--------+  +--------+       |
|  |PostgreSQL|  | Valkey |  | MinIO |       |
|  +--------+  +--------+  +--------+       |
|                                            |
|  +--------+  +--------+  +--------+       |
|  | Worker |  | Backup |  | Vault  |       |
|  +--------+  +--------+  +--------+       |
+------------------------------------------+
```

---

## Network Topology

### Public Tier
- **Caddy** → ports 80/443
- **API Gateway** → routed by Caddy via `api.infra.omdala.com`
- **Keycloak** → routed by Caddy via `auth.infra.omdala.com`

### Protected Tier
- **Admin Console** → IP-whitelist or VPN only
- **Monitoring** → Basic Auth + IP-whitelist
- **Backup Portal** → Approval-gated access

### Private Tier (internal Docker network only)
- **PostgreSQL** → port 5432, no public ingress
- **Valkey** → port 6379, no public ingress
- **MinIO** → port 9000/9001, internal only
- **Vault** → port 8200, internal only

---

## Data Flow — API Request

```
1. User → Caddy (HTTPS termination)
2. Caddy → API Gateway (internal:3000)
3. API Gateway → JWT verification (Keycloak public key)
4. API Gateway → Tenant routing (X-Tenant-ID header)
5. API Gateway → PostgreSQL (internal:5432)
6. API Gateway → Valkey (internal:6379) for rate limit/session
7. API Gateway → Audit log (async write to PostgreSQL)
8. Response → Caddy → User
```

---

## Data Flow — Background Job

```
1. API Gateway pushes job to Valkey queue
2. Worker polls Valkey, picks up job
3. Worker executes (DB query, R2 upload, email send)
4. Worker writes result to PostgreSQL
5. Worker pushes success/failure to audit log
6. On failure: retry 3x, then move to DLQ + alert
```

---

## Approval Gate Architecture

```
Destructive Action Request
         |
         v
+------------------+
| Approval Portal  |  (admin.infra.omdala.com)
+------------------+
         |
         v
+------------------+
| GitHub PR        |  2 reviewers + Founder veto
+------------------+
         |
         v
+------------------+
| Evidence Log     |  Immutable entry in PostgreSQL
+------------------+
         |
         v
+------------------+
| Execution        |  Only after all gates pass
+------------------+
```

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| VPS | Hetzner CX42 | Germany/Singapore, NVMe, €15–20/mo |
| Reverse Proxy | Caddy | Auto HTTPS, simpler config than Traefik |
| Database | PostgreSQL 17 | Core replacement for Supabase, pgvector for AI |
| Auth | Keycloak 25 | Multi-tenant, enterprise-grade, Quarkus fast boot |
| Cache/Queue | Valkey 8 | Redis fork, better OSS license than Redis 7.4+ |
| Storage | R2 + MinIO | R2 cheap egress, MinIO for warm internal cache |
| Worker | Node.js 22 + BullMQ | Familiar stack, proven job processing |
| Monitoring | Uptime Kuma + Grafana | Lightweight, no Prometheus needed for single-node |
| Backup | pg_dump + WAL-G + R2 | Point-in-time recovery, encrypted |
| Secrets | Vault dev → HA | Phase 1 dev mode, Phase 2 Raft consensus |

---

## Scaling Path

| Phase | Scale | Architecture |
|-------|-------|------------|
| P0–P5 | Single VPS | Docker Compose, single-node |
| P6–P8 | Single VPS + workers | Docker Compose, worker replicas |
| P9+ | Multi-node | Docker Swarm or k3s |
| Future | Multi-region | Caddy + Anycast + replicated PostgreSQL |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| VPS downtime | Daily backup to R2; cold standby config ready |
| Keycloak misconfig | Realm export before changes; test realm for experiments |
| Data corruption | Parallel running; checksum validation; 30-day rollback window |
| Secret leak | `git-secrets`, SOPS, Vault; quarterly rotation |
| Single point of failure | Phase 2: Docker Swarm; Phase 3: multi-region |

---

**Next:** P3 — Docker Compose implementation → `../docker-compose.yml`
