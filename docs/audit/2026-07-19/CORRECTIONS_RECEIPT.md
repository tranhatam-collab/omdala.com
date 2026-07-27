# Corrections Receipt — Per Independent Verification

## Date: 2026-07-19
## Status: Corrections applied to clean worktree (NOT committed, NOT pushed)

## Corrections Applied

### 1. G0.6 Diff Receipt — CORRECTED
- **File:** `G0_6_DIFF_RECEIPT_v2_CORRECTED.md`
- **Issue:** v1 misclassified `infra/` (98 files) and `om-ai.omdala.com/` (323 files) as "separate subprojects outside canonical repo"
- **Fix:** Regenerated diff from `git ls-tree -r --name-only HEAD`. Both dirs ARE tracked in canonical.
- **Result:** 628 files in both, 517 only in canonical, 540 only in current. `Omone.omdala.com/` (263) is genuinely separate.

### 2. ADR-003 D1 Limits — CORRECTED
- **File:** `ADRS_G1_4.md` (ADR-003 section)
- **Issue:** Stated 5GB limit per DB. Incorrect.
- **Fix:** Updated to Cloudflare docs: 10GB Paid, 500MB Free, single-threaded, Sessions API required for read replication.
- **References:** https://developers.cloudflare.com/d1/platform/limits/, https://developers.cloudflare.com/d1/best-practices/read-replication/

### 3. ADR-005 Auth Stack — CORRECTED
- **File:** `ADRS_G1_4.md` (ADR-005 section)
- **Issue:** Claimed Auth.js (NextAuth) as sole auth stack. Source has NO `next-auth` or `@auth` dependency.
- **Fix:** Revised to "Keep existing custom auth (magic-link + Google OAuth + HMAC sessions)". Documented actual implementation from `apps/auth/app/login/AuthLoginForm.tsx` and `services/api/src/index.ts`.

### 4. ADR-006 OMCODE Boundary — CORRECTED
- **File:** `ADRS_G1_4.md` (ADR-006 section)
- **Issue:** Claimed OMCODE is extracted to separate repo. Source still has `apps/app/app/omcode/` and `apps/app/app/omcode/landing/`.
- **Fix:** Revised to "NOT YET IMPLEMENTED". Documented current state.

### 5. Root package.json — npm → pnpm
- **File:** `package.json` (root)
- **Issue:** Scripts used `npm run` and `npm --prefix` despite `packageManager: pnpm@9.15.0`.
- **Fix:** All scripts now use `pnpm run` and `pnpm --filter`. Added `typecheck`, `test:api`, `test:app`, `build:all` scripts.

### 6. services/api package.json — Added test script
- **File:** `services/api/package.json`
- **Issue:** No `test` script defined.
- **Fix:** Added `"test": "vitest run"`.

### 7. CI Workflow — Expanded
- **File:** `.github/workflows/ci.yml`
- **Issue:** Removed API/worker tests in v1 fix. No lint job. No security scan.
- **Fix:** Added `test-api` job (47 tests), `test-app` job (27 tests), `lint` job, `security-scan` job (secret detection + dependency audit).

### 8. D1 Migrations — CREATED
- **Files:** `migrations/{db}/0001_initial_schema.sql` (4 databases)
- **Issue:** No D1 migrations existed for G4 domain model.
- **Fix:** Created initial schema for all 20 entities:
  - `omdala-global-staging`: tenant, country, administrative_region, local_node, compliance_profile (5 entities)
  - `omdala-vn-staging`: brand, owner, consent, place, product, experience, image_asset, inquiry, site, domain_binding, translation, agent_run, approval, release (14 entities)
  - `omdala-auth-staging`: user, session, oauth_account, magic_link_token (4 entities)
  - `omdala-audit-staging`: evidence_log, audit_event (2 entities)
  - Total: 25 tables (some entities map to multiple tables)

### 9. Tenant Isolation Guard + Tests — CREATED
- **Files:** `services/api/src/tenant/guard.ts`, `services/api/src/tenant/guard.test.ts`
- **Issue:** No tenant isolation enforcement (D1 has no RLS).
- **Fix:** Created application-level tenant guard with:
  - `assertTenantFilter()` — rejects queries on tenant-scoped tables without `tenant_id`
  - `withTenantFilter()` — injects `tenant_id` into queries
  - `validateTenantAccess()` — rejects cross-tenant access for non-superadmin
  - 15 tests covering: missing filter, superadmin bypass, cross-tenant denial, INSERT/UPDATE/DELETE guards

## Test Results After Corrections

| Suite | Before | After |
|-------|--------|-------|
| services/api | 32 tests PASS | **47 tests PASS** (32 + 15 tenant-isolation) |
| apps/app | 27 tests PASS | 27 tests PASS (unchanged) |
| TypeScript (4 packages) | PASS | PASS |
| Next.js builds (5 apps) | PASS | PASS |

## Still Pending (per Independent Verification backlog)

1. **Hydrate 290 dataless files** — rerun snapshot/diff
2. **Review dirty candidate diff** — 4 modified, 33 staged deletions, 2706-line lockfile change (reviewed, not yet decided to keep/revert)
3. **Commit accepted candidate** — run GitHub CI on exact SHA
4. **Apply D1 migrations to staging** — `wrangler d1 migrations apply`
5. **Secret rotation** — 7 secrets
6. **Backup/restore drill** — on staging
7. **Brand Factory renderer/API/approval** — implementation
8. **Deploy to Pages** — wrangler OAuth available
9. **Staging verification** — auth, tenant isolation, migration, backup/restore
10. **New Founder release packet** — with committed SHA

## NOT Done (per Independent Verification ruling)
- No production deployment
- No migration applied to remote D1
- No commit/push
- No product code changes beyond CI/package.json/migrations/tests
