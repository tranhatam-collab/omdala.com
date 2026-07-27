# ADR-001 — Global Platform with Country/Region Tenant Hierarchy

## Status
ACCEPTED — 2026-07-19 (G1.3, Founder-locked)

## Context
OMDALA needs to scale across 10 Southeast Asian countries while maintaining local relevance, compliance, and brand identity. Two competing models existed:
1. Global-first platform with tenant hierarchy
2. Local Brand Factory with bespoke sites per country

The audit (2026-07-19) found conflicting documentation supporting both models, causing architecture drift and ownership ambiguity.

## Decision
**Global platform with country/region tenant hierarchy.**

One platform, one codebase, one database cluster — with tenant isolation by country/region:

```
OMDALA Global → Country → Province/State → City/District → Local Node → Brand/Place
```

## Rationale
- One renderer/design system with local theme tokens, not forked codebases
- Tenant isolation at data level (D1 per-tenant or row-level partitioning)
- Shared infrastructure, lower cost
- Centralized governance, decentralized content
- AI automation 80-90% with human approval for publish

## Consequences
- Need tenant-aware data model (Tenant, Country, Region, LocalNode, Place, Brand)
- Need country-specific locale, currency, timezone, address schemas
- Need compliance packs per country
- No bespoke codebases per country

## Supersedes
- `docs/OMDALA_SCALE_MVP_PLAN_2026.md` (local-first claims)
- Any document claiming "hundreds of bespoke sites"

---

# ADR-002 — Tenant Hierarchy Model

## Status
ACCEPTED — 2026-07-19 (G1.3)

## Context
Need explicit tenant hierarchy for multi-tenant isolation and data ownership.

## Decision
```
OMDALA Global (root tenant)
  └── Country (e.g., Vietnam, Thailand)
       └── Province/State (e.g., Ho Chi Minh, Bangkok)
            └── City/District (e.g., District 1, Sukhumvit)
                 └── Local Node (e.g., a neighborhood or venue cluster)
                      └── Brand/Place (e.g., a restaurant, hotel, experience)
```

## Entities
- **Tenant** — root organization (OMDALA Global or country operator)
- **Country** — ISO 3166-1 alpha-2 code, locale, currency, timezone
- **AdministrativeRegion** — province/state, nested admin divisions
- **LocalNode** — neighborhood, venue cluster, or POI
- **Place** — physical location with address, geo, hours
- **Brand** — business entity owning one or more Places
- **Owner** — user account with verified ownership of a Brand/Place
- **Consent** — owner consent records for data usage, image rights
- **Product** — bookable/purchasable item
- **Experience** — curated experience package
- **ImageAsset** — image with provenance and rights
- **ComplianceProfile** — country-specific compliance settings
- **Inquiry** — customer inquiry/booking request
- **Site** — localized website instance for a Brand/Place
- **DomainBinding** — custom domain mapping to a Site
- **Translation** — localized content entries
- **AgentRun** — AI automation execution record
- **Approval** — human approval for AI-generated content
- **EvidenceLog** — audit trail for compliance
- **Release** — content publish/rollback record

## Consequences
- D1 schema must support this hierarchy (G3.5)
- Tenant isolation via application-level filtering (D1 has no RLS)
- AI automation respects tenant boundaries

---

# ADR-003 — Cloudflare D1 as Sole Database

## Status
ACCEPTED — 2026-07-19 (G1.3, Founder-locked)

## Context
Need database for multi-tenant platform. Options were:
1. Cloudflare D1 (edge, serverless, SQLite, 5GB limit per DB)
2. VPS PostgreSQL (sovereign, full control, RLS)
3. Hybrid D1 + PostgreSQL

## Decision
**Cloudflare D1 only.**

## Rationale
- Serverless, no VPS management
- Native to Workers (no Hyperdrive needed)
- Lower cost for MVP/early stage
- SQLite simplicity

## Consequences
- **D1 limits (CORRECTED per Cloudflare docs 2026-07-19):**
  - Workers Paid: 10 GB maximum per database
  - Workers Free: 500 MB maximum per database
  - Each database is single-threaded — queries processed one at a time
  - Read replication requires D1 Sessions API — NOT automatic; application must opt in
- **Multi-DB strategy (10GB Paid limit):**
  - `omdala_global` — global metadata, tenants, countries
  - `omdala_{country_code}` — per-country data (e.g., `omdala_vn`, `omdala_th`)
  - `omdala_audit` — audit logs, evidence
- **No RLS** — tenant isolation via application-level filtering
- **No pg_dump** — backup via D1 export (`wrangler d1 export`)
- **No PostgreSQL features** — no JSONB operators, no full-text search (use Workers AI/Vectorize instead)
- **Migrations** — via wrangler d1 migrations
- **Concurrency:** D1 is single-threaded per database; high-concurrency workloads may need connection-aware design or Durable Objects for coordination
- **Read replication:** Must use D1 Sessions API explicitly for replica reads; creating a D1 database does NOT automatically provide replica reads

## References
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/d1/best-practices/read-replication/

## Supersedes
- `docs/OMDALA_VPS_POSTGRES_HARDENING_CHECKLIST_2026.md`
- `infra/docs/MIGRATION_FROM_SUPABASE.md` (PostgreSQL assumptions)
- Any document assuming PostgreSQL/Keycloak/OpenFGA

---

# ADR-004 — Cloudflare Account Ownership

## Status
ACCEPTED — 2026-07-19 (G0.5, Founder-locked)

## Decision
- **Account:** Tranhatam@gmail.com
- **Account ID:** f3f9e76222dcb488d5e303e29e8ba192
- All production deployments use this account

## Supersedes
- `docs/CLOUDFLARE_ACCOUNT_BASELINE_OMDALA.md`

---

# ADR-005 — Custom Auth (Magic Link + Google OAuth + HMAC Sessions) — CORRECTED

## Status
REVISED — 2026-07-19 (per Independent Verification: ADR-005 v1 claimed Auth.js but source uses custom auth)

## Context
ADR-005 v1 chose Auth.js (NextAuth) as sole auth stack. Independent verification proved this does NOT match canonical source:
- `apps/auth` has NO `next-auth` or `@auth` dependency
- `apps/auth/app/login/AuthLoginForm.tsx` calls custom endpoints: `/v1/auth/magic-link/request`, `/v1/auth/session/exchange`, `/v1/auth/google/start`
- `services/api/src/index.ts` implements custom HMAC sessions (SHA-256), magic-link flow, Google OAuth, and session exchange
- No NextAuth configuration exists anywhere in the codebase

## Decision
**Keep existing custom auth implementation. Do NOT migrate to Auth.js.**

The canonical source already has a working custom auth system:
- Magic link email authentication
- Google OAuth integration
- HMAC-based session tokens (SHA-256)
- Session exchange flow
- Session verification via `requireAuthenticatedSession`

## Current Implementation (from source)
| Component | Location | Behavior |
|-----------|----------|----------|
| Login frontend | `apps/auth/app/login/AuthLoginForm.tsx` | Magic link form + Google OAuth button |
| Magic link request | `POST /v1/auth/magic-link/request` | Sends magic link email |
| Magic link verify | `GET /v1/auth/magic-link` | Verifies token, returns session |
| Session exchange | `POST /v1/auth/session/exchange` | Exchanges code for session token |
| Session check | `GET /v1/auth/session` | Returns authenticated state |
| Google OAuth start | `GET /v1/auth/google/start` | Redirects to Google |
| Session crypto | `services/api/src/index.ts` | HMAC SHA-256, Web Crypto API |
| Session middleware | `requireAuthenticatedSession(c)` | Validates session token |

## Consequences
- No Auth.js/NextAuth dependency needed
- No Keycloak, no Cloudflare Access for app auth
- Sessions are HMAC-signed tokens (not JWT library)
- MFA: not yet implemented (future: TOTP via custom endpoint)
- Roles: application-level (admin, owner, user) — enforced in API routes
- Must fix auth.omdala.com semantic 404 (AUTH-001) — deploy apps/auth to Pages
- User data in D1 (when migrations are created)

## Supersedes
- ADR-005 v1 (Auth.js claim) — REVISED
- Any document assuming Keycloak or Cloudflare Access for app auth

---

# ADR-006 — OMCODE Boundary — CORRECTED

## Status
REVISED — 2026-07-19 (per Independent Verification: extraction not yet done)

## Context
ADR-006 v1 stated OMCODE is a separate repository and should be extracted. Independent verification proved:
- `apps/app/app/omcode/` and `apps/app/app/omcode/landing/` still exist in canonical source
- `apps/app/.omcode/build.sh` exists in canonical
- No extraction has been performed
- No separate `github.com/tranhatam-collab/omcode` repo has been verified as active

## Decision
**OMCODE boundary target: separate repository. Status: NOT YET IMPLEMENTED.**

The decision remains that OMCODE should eventually be a separate repo, but the current canonical source still contains OMCODE routes and code. This is a known gap, not a completed decision.

## Current State (from canonical source)
| Path | Status |
|------|--------|
| `apps/app/app/omcode/page.tsx` | EXISTS in canonical |
| `apps/app/app/omcode/landing/page.tsx` | EXISTS in canonical |
| `apps/app/.omcode/build.sh` | EXISTS in canonical |
| Separate OMCODE repo | NOT VERIFIED |

## Consequences
- OMCODE routes are currently part of the omdala.com deploy
- Extraction is a FUTURE task, not a completed decision
- OMCODE audit docs (`docs/OMCODE_*.md`) remain REFERENCE
- Cannot claim "OMCODE is outside the monorepo" until extraction is done

## Supersedes
- ADR-006 v1 (claimed extraction done) — REVISED
- `docs/OMCODE_APP_RELEASE.md` (SUPERSEDED)
- `docs/OMCODE_AUDIT_100_PERCENT_2026-06-01.md` (SUPERSEDED)
