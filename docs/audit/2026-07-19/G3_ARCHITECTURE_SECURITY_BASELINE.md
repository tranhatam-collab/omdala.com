# G3 — Architecture and Security Baseline

## Date: 2026-07-19

## G3.1 — Cloudflare Edge Architecture (per ADR-003)

### Decision: Cloudflare D1 only — no VPS PostgreSQL

**Architecture:**
```
                    Cloudflare Edge (global)
                          |
                    Workers (compute)
                    /     |     \
                 D1      KV      R2
              (data)   (cache)  (assets)
                 |
            Workers AI / Vectorize
            (AI inference + semantic search)
```

**No sovereign PostgreSQL control plane.** All data lives in D1 (SQLite at edge).

**Multi-DB strategy (10 GB Paid limit per ADR-003):**
- `omdala_global` — tenants, countries, admin regions, global config
- `omdala_vn` — Vietnam data (brands, places, products, inquiries)
- `omdala_th` — Thailand data
- `omdala_{country_code}` — per-country (expand as needed)
- `omdala_audit` — audit logs, evidence, agent runs
- `omdala_auth` — users, sessions, OAuth state

**No Hyperdrive** (D1 is native to Workers, no connection pooling needed).

---

## G3.2 — D1/KV/R2/Queues/Hyperdrive Lifecycle

| Service | Decision | Rationale |
|---------|----------|-----------|
| **D1** | KEEP | Primary database (ADR-003) |
| **KV** | KEEP | Session cache, rate limit counters, feature flags |
| **R2** | KEEP | Image assets, static uploads, backups |
| **Queues** | KEEP | Async jobs (AI generation, email sending, image processing) |
| **Hyperdrive** | DELETE_LATER | Not needed with D1 — was for PostgreSQL connection pooling |
| **Workers AI** | KEEP | AI inference at edge (content generation, embeddings) |
| **Vectorize** | KEEP | Semantic search for brands, places, experiences |
| **Durable Objects** | KEEP (future) | Real-time coordination (chat, booking, multiplayer) |
| **Email Routing** | KEEP | Transactional email |
| **Pages** | KEEP | Static site hosting for docs/admin |

---

## G3.3 — Custom Auth Responsibilities (per ADR-005 REVISED)

**No Keycloak, no Cloudflare Access for app auth, no OpenFGA. No Auth.js/NextAuth in canonical source.**

| Component | Responsibility |
|-----------|---------------|
| Custom auth (`services/api`) | Magic link, Google OAuth, HMAC session tokens (SHA-256) |
| D1 `omdala_auth` | User accounts, sessions, magic links, OAuth state |
| KV | Session cache, rate limit |
| Application-level RBAC | Role checks in middleware and API routes |

**Roles:**
- `superadmin` — OMDALA global admin
- `country_admin` — country-level admin
- `owner` — brand/place owner
- `user` — end user

**AUTH-001 Fix (auth.omdala.com semantic 404):**
- auth.omdala.com should serve the custom login shell (`apps/auth`)
- Currently returns 200 with 404 content — fix by deploying apps/auth to auth.omdala.com
- Verify in G5 staging

---

## G3.4 — Secret Inventory and Rotation

### Secret-bearing files found (G0.2):
| File | Size | Status |
|------|------|--------|
| `.env.db.local` | 186 bytes | EXCLUDED from git, values not read |
| `infra/.env.local` | 5794 bytes | EXCLUDED from git, values not read |
| `Omone.omdala.com/.env` | 3072 bytes | Separate repo, EXCLUDED |
| `Omone.omdala.com/.env.example` | 3189 bytes | Template, likely safe |

### Required secrets for OMDALA production:
| Secret | Purpose | Rotation needed? |
|--------|---------|-----------------|
| `CLOUDFLARE_API_TOKEN` | Workers deployment | YES — create new scoped token |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID | No (not secret) |
| `AUTH_SECRET` | HMAC session signing (`services/api`) | YES — generate new |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth | No (public) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth | YES — rotate |
| `GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth | No (public) |
| `GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth | YES — rotate |
| `EMAIL_API_KEY` | Email sending | YES — rotate |
| `WORKERS_AI_API_TOKEN` | AI inference | Use CLOUDFLARE_API_TOKEN |

### Action items:
1. All secrets stored in Cloudflare Secrets Store (not in .env files)
2. `.env` files only for local dev with placeholder values
3. Rotate all secrets before G5 staging deploy
4. Verify no secrets in git history (git log -p --all | grep -i secret)

---

## G3.5 — Migrations, Tenancy, Audit, Backup, Restore, Rollback

### Migrations
- Use `wrangler d1 migrations` for schema changes
- Migration files in `migrations/` directory
- Each migration has up and down (rollback) script
- Migrations run per-DB (omdala_global, omdala_vn, etc.)

### Tenancy (application-level, no RLS)
- Every query MUST include `WHERE tenant_id = ?` or `WHERE country_code = ?`
- Middleware enforces tenant context from JWT or domain
- No cross-tenant queries without explicit superadmin role
- Audit log records all cross-tenant access

### Audit logs
- `omdala_audit` D1 database
- Every mutation logged: who, what, when, tenant, before/after
- AgentRun records for AI automation
- EvidenceLog for compliance

### Backup
- `wrangler d1 export` per database, daily
- Export to R2 bucket `omdala-backups`
- Retention: 30 daily, 12 monthly, 7 yearly
- Backup verification: restore to staging, run smoke tests

### Restore
- `wrangler d1 import` from R2 backup
- Restore drill in G5.4
- RTO: 1 hour, RPO: 24 hours

### Rollback
- Content rollback: `Release` table tracks publish/rollback
- Code rollback: redeploy previous Workers deployment
- DB rollback: reverse migration or restore from backup

---

## G3 EXIT — Threat Model and Least-Privilege

### Threat Model
| Threat | Mitigation |
|--------|-----------|
| Unauthorized data access | Custom HMAC sessions + application-level tenant isolation |
| Secret leakage | Cloudflare Secrets Store, no .env in git |
| D1 data loss | Daily R2 backups, restore drills |
| AI cost overrun | Per-tenant cost limits, Queues for rate limiting |
| XSS/CSRF | Next.js built-in protections, CSP headers |
| DDoS | Cloudflare edge protection (built-in) |
| Supply chain | pnpm lockfile, minimum release age policy |

### Least-Privilege Matrix
| Role | D1 Access | KV Access | R2 Access | Workers AI |
|------|-----------|-----------|-----------|-----------|
| superadmin | All DBs | All keys | All buckets | Unlimited |
| country_admin | country DB only | country keys | country assets | country budget |
| owner | own brand data | own cache | own images | limited budget |
| user | public data only | session only | public assets | read-only |
| anonymous | public data only | none | public assets | none |

### Migration Receipts
- D1 migration SQL created: `infra/d1/migrations/0001_brand_factory_global.sql` (20 entities)
- Auth schema: `infra/d1/migrations/0002_auth_schema.sql`
- Audit schema: `infra/d1/migrations/0003_audit_schema.sql`
- Tenant isolation tests: `packages/core/src/tenant-isolation.test.ts`
- **Remote apply:** deferred until G5 Founder authorization (databases currently empty shells)

### Restore Test
- Scheduled for G5.4 (staging restore drill)

---

## G3 Verdict
**PASS (plan-level)** — Architecture defined, security baseline established, threat model documented, least-privilege matrix defined. Actual migration/restore receipts deferred to G4/G5.
