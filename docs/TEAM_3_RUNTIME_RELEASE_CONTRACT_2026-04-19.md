# TEAM_3_RUNTIME_RELEASE_CONTRACT_2026-04-19.md

**Version**: 1.0  
**Status**: CANONICAL TEAM 3 RUNTIME + RELEASE CONTRACT  
**Date**: April 19, 2026  
**Owner**: Team 3 (Platform Core, API, QA, and Release)  
**Scope**: `services/*`, `packages/core`, `packages/types`, `infra/*`, `scripts/*`

---

# 1. Purpose

Lock one runtime and release contract for all OMDALA surfaces:

- `omdala.com`
- `docs.omdala.com`
- `app.omdala.com`
- `auth.omdala.com`
- `admin.omdala.com`
- `api.omdala.com`

This contract is the Team 3 handoff artifact required by:

- `docs/OMDALA_DEV_TEAM_EXECUTION_PLAN_2026-04-17.md`
- `docs/OMDALA_3_TEAM_DELIVERY_BACKLOG_2026-04-19.md`
- `docs/OMDALA_IMPLEMENTATION_CHECKLIST_BY_SURFACE_2026-04-19.md`

---

# 2. Domain and Environment Inventory

## 2.1 Canonical origins

- `OMDALA_WEB_ORIGIN=https://omdala.com`
- `OMDALA_DOCS_ORIGIN=https://docs.omdala.com`
- `OMDALA_APP_ORIGIN=https://app.omdala.com`
- `OMDALA_AUTH_ORIGIN=https://auth.omdala.com`
- `OMDALA_ADMIN_ORIGIN=https://admin.omdala.com`
- `OMDALA_API_ORIGIN=https://api.omdala.com`

## 2.2 Runtime env anchors

- API runtime: `services/api/src/index.ts`
- Auth helpers: `services/auth/src/jwt.ts`
- Shared client contracts: `packages/core/src/*`, `packages/types/src/*`
- Deploy and verify scripts: `scripts/release_deploy.sh`, `scripts/release_verify.sh`, `scripts/verify-api-omdala.sh`

Hard rule:

- No cookie, auth issuer, callback, or redirect assumption may target outside `*.omdala.com`.

---

# 3. Auth, Cookie, Issuer, and Session Contract

## 3.1 Session flow authority

Canonical flow:

1. `app.omdala.com` redirects unauthenticated users to `auth.omdala.com`.
2. `auth.omdala.com` exchanges login token via `api.omdala.com`.
3. API sets HttpOnly cookies scoped to `.omdala.com`.
4. Product surfaces read server session from API contract.

## 3.2 Cookie contract

Session cookies are set by API with:

- `HttpOnly`
- `Secure`
- `SameSite=Lax`
- `Path=/`
- `Domain=.omdala.com`

Reference implementation:

- `services/api/src/index.ts` (`buildSetCookie`, `buildClearCookie`, `setSessionCookies`)

## 3.3 Issuer contract

JWT issuer validation is defined in:

- `services/auth/src/jwt.ts`

Rule:

- Issuer must be explicit and consistent across token sign and verify paths.

---

# 4. API and Shared Type Contract Baseline

Team 3 contract boundaries:

- API endpoints and envelopes are owned by `services/api`.
- Shared domain and app-facing typings are owned by `packages/types`.
- Reusable runtime helpers and cross-surface primitives are owned by `packages/core`.

Contract stability rule:

- Breaking API shape or shared type changes must be published before Team 2 locks redirect/session UX behavior.

---

# 5. Release and Smoke Gate

Mandatory Team 3 gate before go/no-go:

1. Build and typecheck pass for Team 3 owned surfaces.
2. Smoke checks are executed where environment access is available.
3. Blockers are updated with owner and next action.
4. Rollback path is confirmed and documented.
5. Team 1 and Team 2 sign-off evidence is attached.

Primary command anchors:

- `pnpm release:verify`
- `pnpm release:deploy`
- `pnpm smoke:reality`
- `pnpm smoke:reality:ci`

---

# 6. Release Owner Matrix

- Team 1: public copy, docs, metadata, canonical sign-off.
- Team 2: app/auth/admin route and UX flow sign-off.
- Team 3: runtime contract, verification gate, release evidence, rollback readiness.

Team 3 has final veto authority for runtime/auth/contract/release risk.

---

# 7. Rollback Contract

Rollback baseline:

1. API: switch to previous known-good Worker deployment.
2. App/Auth/Web/Admin: redeploy previous known-good Pages build.
3. Keep DNS unchanged unless DNS is the incident root cause.
4. Re-run smoke checks after rollback and record evidence.

---

# 8. Team 3 Acceptance Gate

Team 3 delivery is accepted when:

- runtime contract is documented and current
- shared contracts are stable and consumable
- release checks are repeatable by the team
- blockers are explicit and owned
- release evidence includes Team 1 + Team 2 sign-off inputs

---

# END OF FILE
