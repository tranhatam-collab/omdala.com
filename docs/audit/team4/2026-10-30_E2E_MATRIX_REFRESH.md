# E2E-0 matrix refresh at team heads (delta against 2026-10-28 matrix)

- Order: WO-T4-04. Base matrix: `docs/audit/team4/2026-10-28/E2E_MATRIX.md` (7abd962). Heads read: T2 `3988b4c`, T3 `2b35cfc`, TAI `d141c22`. Evidence: local runs from WO-T4-03 (VERIFIED_HEAD_ONLY at `1f1d532` / `2b35cfc` / `d141c22`); T2's three commits after `1f1d532` are not yet verified; CI run on `1f1d532` and `d141c22` VERIFIED_CURRENT; T3 head has no hosted run (NOT_CHECKED).
- This is a delta, not a regenerated 720-cell table. IDs below are file names under the named team's branch.

## 1. Cells closed or improved by the first wave

| Surface / journey | Env | Was | Now | Evidence |
|---|---|---|---|---|
| api / J4 session expiry | local-mock | GAP | COVERED | `services/api/src/auth-session-negatives.test.ts`: expired access token; expired server-side session |
| api / J5 revoke | local-mock | COVERED (logout) | COVERED+ | same file: access and refresh rejected after revoke; refresh-as-access confusion |
| api / J6 replay | local-mock | COVERED | COVERED+ | same file: replayed magic link, expired/tampered/foreign-secret/malformed, email mismatch |
| api / J7 wrong tenant/workspace | local-mock | PARTIAL | COVERED (HTTP level) | same file: another account's workspace/notifications hidden; mismatched session id/email rejected. `v2-reality-tenant-isolation.test.ts`: every `/v2/reality` route unauthenticated 401, cross-tenant 404/501, writes map foreign references to 404 |
| api / all rows | local-integrated | GAP | PARTIAL | opt-in (`OMDALA_TEST_DATABASE_URL`) real-PostgreSQL suites: `postgres-bootstrap.integration.test.ts` (6), `db/auth-repository.integration.test.ts` (7, 1 fails on a server whose certificate verifies), `db/reality-repository.integration.test.ts`. Not in CI: skipped without a database (21 skips) |
| api / J12 API-down | local-mock | COVERED | COVERED+ | `failure-states.test.ts`: 503 DATABASE_UNAVAILABLE on magic-link request, exchange, refresh, protected route; 504 DATABASE_TIMEOUT; 503 PERSISTENCE_REQUIRED; mail failures never a false success |
| api / J11, J13 AI | local-mock | COVERED / PARTIAL | COVERED+ | `aiagent-proxy.failures.test.ts`: 429 with Retry-After pass-through and clamp, 504 on timeout, 502 otherwise, no provider body or credential echoed; `aiagent-client.contract.test.ts` |
| auth / J2, J3, J4, J14 | local-mock | GAP | COVERED | `apps/auth/e2e/auth.spec.ts` 16 specs: login EN/VI, `/` redirect, noindex, magic-link landing missing/invalid/expired/unreachable, token removed from URL, 404 |
| docs / J1, J2, J14 | local-mock | GAP | COVERED | `apps/docs/e2e/docs.spec.ts` 22 specs: routes, EN/VI, canonical/hreflang/sitemap, 404 (noindex via robots) |
| admin / J1, J2, J3 gate, J14 | local-mock | GAP | COVERED | `apps/admin/e2e/admin.spec.ts` 24 specs: routes, EN/VI, noindex, default-deny and preview modes |
| om-ai web / J11, J12, J13 | local-mock | PARTIAL/GAP | PARTIAL+ | `om-ai.omdala.com/web/tests/liveErrors.test.ts` (7): backend-down, quota, provider-429, plan refusals produce clear messages |
| om-ai backend / J7, J9, J10 | local-mock | PARTIAL | PARTIAL+ | `live.safety.test.ts`, `live.metering.test.ts`, `live.plan-change.test.ts`, `memory-schema.test.ts`; backend now 47 tests |

Counts at heads (git, from reports and VERIFY runs): Playwright specs +3 files (auth 16, docs 22, admin 24 tests); API test files 28 at T2 head (was 19); om-ai backend tests 47 (was a base count not recorded); Auth, Admin, Docs now have specs (0 -> 3 files).

## 2. Remaining gaps, owner, proposed one-line order

| # | Gap | Owner | Proposed order |
|---|---|---|---|
| 1 | Real-PostgreSQL suites are opt-in and skipped in CI; no D1 local emulation tier | T1 (CI), T2 | WO-T1-03: add a postgres:17 service and `OMDALA_TEST_DATABASE_URL` to CI so the 21 skips run |
| 2 | Integration test assumes an untrusted server certificate | T2 | Make `auth-repository.integration.test.ts` provision its own untrusted cert or skip with a reason |
| 3 | No end-to-end browser journey across auth -> app with a real local API (all Playwright specs mock `/v1/*`) | T2 + T3 | New order: local-integrated Playwright run with the API worker on a scratch DB (E2E-2 exit) |
| 4 | App 401-redirect specs navigate to the real `auth.omdala.com` | T3 | Route the auth origin through a local stub in `apps/app/e2e/auth-dashboard.spec.ts` |
| 5 | T3 branch has no hosted CI (WO-T3-CI BLOCKED) | T0 / T1 | Apply the `ci.yml` branch line on `claude/omdala-t3-web` |
| 6 | Dashboard CRUD UI untested (R-08/R-09 inert buttons) | T3 | WO-T3-05 |
| 7 | Billing sandbox flow, mail sink through the UI forms | T2 + T3 | New order: UI-driven contact/access-request form test against the staging-sink policy (local stub) |
| 8 | AI cost-cap exhaustion end to end | T2 + TAI | New order: cap-exhausted chat from UI to API stub asserting the user-visible state |
| 9 | DR: T2 has a local rehearsal commit (`01f22d3`); script restore tests only elsewhere | T1 / T2 | Verify `01f22d3` receipt in the next WO-T4-03 pass; then E2E-5 byte-compare |
| 10 | Desktop terminal test hardcodes `/bin/zsh` | T1 | In WO-T1-03 |
| 11 | Staging and production specs never run | T1 + operator | E2E-3 dry-run (WO-T1-02) |
| 12 | VI browse asserted on staging/production | T3 | Add a VI assertion to the staging/production go-live specs |
