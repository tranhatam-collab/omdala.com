# G1.3 — Decision Lock Receipt

> **SUPERSEDED for auth/D1/OMCODE:** See `ADRS_G1_4.md` (REVISED 2026-07-19) and `CORRECTIONS_RECEIPT.md`.  
> Auth.js and 5GB D1 claims in this file are **not** current implementation truth.

## Date: 2026-07-19
## Status: LOCKED by Founder

## Locked Decisions

| ID | Decision | Choice | ADR |
|----|----------|--------|-----|
| D-001 | Product model | Global platform with country/region tenant hierarchy | ADR-001 |
| D-002 | Tenant hierarchy | OMDALA Global → Country → Province → City → Local Node → Brand/Place | ADR-002 |
| D-003 | Database | **Cloudflare D1 only** (edge, serverless, SQLite) | ADR-003 |
| D-004 | Cloudflare account | Tranhatam@gmail.com (f3f9e76222dcb488d5e303e29e8ba192) — locked in G0.5 | ADR-004 |
| D-005 | Auth stack | **Auth.js (NextAuth)** — Next.js native, OAuth, self-hosted | ADR-005 |
| D-006 | OMCODE boundary | **Separate repo** (github.com/tranhatam-collab/omcode) | ADR-006 |

## Implications

### D-003: Cloudflare D1 only
- No VPS PostgreSQL, no Keycloak, no OpenFGA server
- All data in D1 (SQLite at edge)
- 5GB limit per DB — need multi-DB strategy for multi-tenant
- Hyperdrive not needed (D1 is native to Workers)
- Backup via D1 export, not pg_dump
- RLS not available — use application-level tenant isolation

### D-005: Auth.js (NextAuth)
- No Keycloak, no Cloudflare Access for app auth
- OAuth providers: Google, GitHub, email magic link
- Session: JWT or D1-backed sessions
- Admin auth: separate Auth.js instance or role-based within same instance
- MFA: TOTP via Auth.js plugins

### D-006: OMCODE separate repo
- OMCODE code in apps/app/omcode/ should be extracted to separate repo
- Linked via npm package or git submodule (not monorepo)
- No OMCODE code in omdala.com canonical repo

## Contradictions Resolved

| ID | Previous conflict | Resolution |
|----|-------------------|------------|
| C-02 | Global-first vs local Brand Factory | RESOLVED — Global platform with tenant hierarchy |
| C-03 | D1 vs VPS PostgreSQL | RESOLVED — D1 only |
| C-04 | Auth stack fragmentation | RESOLVED — Auth.js only |
| C-06 | OMCODE boundary unclear | RESOLVED — Separate repo |

## Remaining Open Items
- C-05: CI npm ci vs pnpm — to be resolved in G2.2
- G3.2: D1/KV/R2/Queues lifecycle — to be defined in G3
- G3.4: Secret rotation — to be executed in G3
