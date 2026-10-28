# E2E-0 matrix: surface x journey x environment

- Order: WO-T4-01 (parents CORE-12 / CORE-15 / CORE-18, plan section 9 stage E2E-0)
- Base SHA: `7abd96251619c20f5e3b94755b307ba191e8bc60` (`OMCODE/infra-e2e-auto-20261026`), branch `claude/omdala-t4-qa` at the same SHA when the suites ran. Date 2026-10-28.
- Author: T4 Independent QA. No product code, test, config or workflow was changed. Generated files that `next dev` rewrote (`apps/app/AGENTS.md`, `apps/app/next-env.d.ts`) were restored with `git checkout` before this commit.
- Evidence words used below: VERIFIED_HEAD_ONLY (T4 ran it at the SHA above), REPORTED_UNVERIFIED, NOT_CHECKED. No hosted CI was read (ci.yml does not run for `claude/omdala-*`), so nothing here is VERIFIED_CURRENT.
- Toolchain: Node v22.22.0 (repo engines want 22.22.3, pnpm prints an engine warning only), pnpm 9.15.0, `pnpm install --frozen-lockfile` exit 0.

## 1. Cell vocabulary

- **COVERED** a test at this SHA asserts the journey for that surface and environment. IDs resolve in section 5. COVERED says the test exists; section 3 says whether it passed when T4 ran it. A staging or production COVERED means the spec exists; T4 did not run it (needs protected environments and secrets, barred by the hard rules) so those are NOT_CHECKED for execution.
- **PARTIAL** something relevant exists; the text says what is missing.
- **GAP** no test found. Source presence of a behaviour (for example a robots file) is not coverage.
- **N/A** with a reason.
- Environments: **local-mock** = unit or Playwright with mocked network or storage; **local-integrated** = real local PostgreSQL/D1 plus worker plus UI in one run; **staging** and **production** = hosted.
- **Finding for the whole matrix:** the local-integrated tier does not exist at this SHA. Every API test uses mocked storage (`vi.hoisted` mocks, in-memory fakes); every Playwright local spec mocks `/v1/*` with `page.route`. All local-integrated cells are GAP or N/A. This is owned by E2E-2 (T2).

## 2. Cell totals (15 journeys x 12 surfaces x 4 environments = 720 cells)

| Environment | COVERED | PARTIAL | GAP | N/A |
|---|---|---|---|---|
| local-mock | 17 | 40 | 55 | 68 |
| local-integrated | 0 | 0 | 112 | 68 |
| staging | 8 | 11 | 93 | 68 |
| production | 7 | 4 | 89 | 80 |
| Total | 32 | 55 | 349 | 284 |

## 3. Suites run by T4 at 7abd962 (VERIFIED_HEAD_ONLY)

| Command | Result |
|---|---|
| `pnpm test:api` | 19 files, 133 tests: 133 pass, 0 fail, 0 skip |
| `pnpm test:app` | 2 files, 27 tests: 27 pass, 0 fail, 0 skip |
| `pnpm test:core` | 1 file, 7 tests: 7 pass, 0 fail, 0 skip |
| `pnpm test:release-governance` | 394 tests: 394 pass, 0 fail, 0 skip, 0 cancelled |
| `pnpm test:brand-core` (extra) | 1 file, 33 tests: 33 pass |
| `pnpm --filter @omdala/billing test` (extra) | 31 tests: 31 pass (pretest builds to a git-ignored `dist`) |
| `pnpm --filter @omdala/brand-marketplace exec vitest run` (extra) | 1 file, 4 tests: 4 pass |
| `pnpm e2e:web` | 1 spec file, 1 test: 1 pass. Server log prints a `generateStaticParams` error for `/favicon.ico` under `next dev` with `output: export`; the test still passes |
| `pnpm e2e:app` | 3 spec files, 18 tests: **15 pass, 3 FAIL**, 0 skip. Failing: `auth-dashboard.spec.ts:193`, `:207`, `:217` (dashboard, profile, settings redirect on 401) |
| `pnpm e2e:brand-exchange` | 3 spec files, 13 tests: 13 pass, 0 fail, 0 skip |
| `cd apps/omcode-desktop && node --test tests/*.test.mjs` (extra) | 113 tests: 111 pass, **2 fail** (one root cause plus its parent suite), 0 skip |

Playwright ran with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium` (an environment variable the three configs already honour); no browser was downloaded and nothing was changed in the repo to do this.

Failure causes (not fixed; T4 does not write product code):

1. `e2e:app` 3 failures: each test expects a redirect to `https://auth.omdala.com/login...`. The sandbox cannot reach that host (`curl` returned `000`), so Chromium ended on `chrome-error://chromewebdata/`. The cause is attributed to sandbox networking, but the tests are also not hermetic: a local-mock test depends on the production auth origin. It is not shown that they pass on a networked runner; treat as REPORTED_UNVERIFIED there. Owner: T3 (`apps/app/**`).
2. Desktop `tests/runtime.test.mjs` "executes actual terminal commands in the selected project" returns 400 instead of 200 because `apps/omcode-desktop/server/index.mjs` hardcodes `/bin/zsh`, absent on this Linux container. Platform dependence, not shown to be a defect on macOS. Owner: T1 (`apps/omcode-desktop/**`).

Not run (NOT_CHECKED): `om-ai.omdala.com/{backend,gateway,app}` suites (dependencies not installed; they use npm lockfiles outside the pnpm workspace; T4 did not install more); `om-ai.omdala.com/web/e2e/app-smoke.spec.ts` (no runnable script or config at the root); desktop `test:ui`, `test:native`, `test:install`, `test:live` (native macOS evidence runners); `pnpm e2e:staging` and `pnpm e2e:production` (need protected environments; barred).

## 4. Test inventory from git at 7abd962

Playwright specs (tracked `*.spec.ts`): 10 files, 41 tests.

| Area | Files | Tests |
|---|---|---|
| App local (`apps/app/e2e`) | 3 | 18 (8 auth-dashboard, 5 welcome-smoke, 5 workspace-critical) |
| App staging go-live (`apps/app/e2e-staging`) | 1 | 4 (serial) |
| App production go-live (`apps/app/e2e-production`) | 1 | 4 (serial) |
| Brand Exchange (`apps/brand-marketplace/e2e`) | 3 | 13 |
| Web (`apps/web/e2e`) | 1 | 1 |
| Om AI web (`om-ai.omdala.com/web/e2e`) | 1 | 1 |
| Auth, Admin, Docs | **0** | **0** |

Unit and integration test files (tracked):

| Area | Files |
|---|---|
| `services/api` | 19 executed by vitest (+1 stray, see below) |
| `apps/omcode-desktop/tests` | 9 |
| `om-ai.omdala.com/app` | 8 (3 jest in `__tests__`, 5 node in `__tests_node__`) |
| `om-ai.omdala.com/backend` | 4 |
| `om-ai.omdala.com/gateway` | 1 |
| `packages/billing` | 3 |
| `packages/core` | 1 |
| `packages/brand-core` | 1 |
| `apps/app` (unit) | 2 (`CostDashboard.test.ts`, `useProjectTracker.test.ts`) |
| `apps/brand-marketplace` (unit) | 1 (`runtime-origins.test.ts`) |
| `scripts` | 38 |
| `infra` | 20 |
| `apps/web`, `apps/auth`, `apps/admin`, `apps/docs`, `services/{ai,auth,matching,notifications,trust}`, `packages/{seo,types,ui}` | 0 |

These match plan section 9 (API 19, desktop 9, Om AI app 8, backend 4, gateway 1, billing 3, core 1, scripts 38, infra 20). Hygiene: a tracked stray `services/api/src/index.v2.db-errors.test 2.ts` is a diverged older copy that vitest does not run (name does not match `*.test.ts`); it is not counted above.

## 5. Matrix by surface

Environment order: local-mock | local-integrated | staging | production. IDs are defined in section 6.

### web (apps/web)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | PARTIAL: only nav-switch spec W1; no EN content/SEO assertions | GAP | COVERED S-RENDER | COVERED P-NAV |
| J2 Public browse VI | COVERED W1 | GAP | PARTIAL: staging render asserts EN only | PARTIAL: production navigation asserts EN only |
| J3 Magic-link login | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J4 Session expiry | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J5 Revoke / logout | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J6 Replay | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J7 Wrong tenant/workspace | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J8 Dashboard CRUD | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J9 Billing/promo sandbox | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J10 Mail sink | GAP | GAP | PARTIAL: S-MAIL drives the API contact/access-request mail, not the web form | N/A: production spend/mail/writes barred by no-spend contract (scripts/production-no-spend-contract.test.mjs, not independently reviewed) |
| J11 AI call under cost cap | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J12 API-down state | GAP | GAP | GAP | N/A: cannot induce on production |
| J13 AI-down state | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J14 404 / noindex | GAP | GAP | GAP | GAP |
| J15 DR / rollback | PARTIAL: script/manifest contract tests only (R1); no rehearsal | GAP | GAP | GAP |

### app (apps/app)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | PARTIAL: A-WELCOME covers /workspace only | GAP | COVERED S-RENDER | COVERED P-NAV |
| J2 Public browse VI | COVERED A-WORKSPACE-03 | GAP | GAP | GAP |
| J3 Magic-link login | PARTIAL: session endpoint mocked; no magic-link landing spec | GAP | COVERED S-SESSION | COVERED P-MAGIC |
| J4 Session expiry | PARTIAL: A-401 x3 exist but FAILED here: they navigate to the real https://auth.omdala.com (unreachable from this sandbox); not hermetic | GAP | GAP | GAP |
| J5 Revoke / logout | GAP | GAP | COVERED S-SESSION (logout step) | COVERED P-MAGIC (logout step) |
| J6 Replay | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row |
| J7 Wrong tenant/workspace | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row |
| J8 Dashboard CRUD | PARTIAL: A-DASH, A-PROFILE, A-SETTINGS render read-only mocked contracts; no UI create/update/delete | GAP | PARTIAL: S-SESSION updates profile/preferences via the API request context, not the UI | GAP |
| J9 Billing/promo sandbox | PARTIAL: A-SETTINGS renders a mocked billing contract only | GAP | GAP | N/A: production spend/mail/writes barred by no-spend contract (scripts/production-no-spend-contract.test.mjs, not independently reviewed) |
| J10 Mail sink | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row |
| J11 AI call under cost cap | PARTIAL: A-WORKSPACE-02/05 assert fail-closed with no verified catalog; no cap assertion | GAP | PARTIAL: S-SESSION makes one AI chat call; cap/quota exhaustion not asserted | PARTIAL: P-MAGIC asserts zero model egress (inverse of a capped call) |
| J12 API-down state | PARTIAL: fail-closed UI states only (A-WORKSPACE-02/05, A-FIXTURE); no 5xx or network-loss spec | GAP | GAP | N/A: cannot induce on production |
| J13 AI-down state | COVERED A-WORKSPACE-02, A-WORKSPACE-05 | GAP | GAP | GAP |
| J14 404 / noindex | GAP | GAP | GAP | GAP |
| J15 DR / rollback | PARTIAL: script/manifest contract tests only (R1); no rehearsal | GAP | GAP | GAP |

### auth (apps/auth)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J2 Public browse VI | GAP | GAP | GAP | GAP |
| J3 Magic-link login | GAP | GAP | PARTIAL: S-RENDER loads /login/ 200 and Google start 302 with PKCE; email magic-link submit not UI-driven | PARTIAL: P-NAV: same as staging |
| J4 Session expiry | GAP | GAP | GAP | GAP |
| J5 Revoke / logout | GAP | GAP | GAP | GAP |
| J6 Replay | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row |
| J7 Wrong tenant/workspace | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row |
| J8 Dashboard CRUD | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J9 Billing/promo sandbox | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J10 Mail sink | GAP | GAP | PARTIAL: S-MAIL at API level only | N/A: production spend/mail/writes barred by no-spend contract (scripts/production-no-spend-contract.test.mjs, not independently reviewed) |
| J11 AI call under cost cap | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J12 API-down state | GAP | GAP | GAP | GAP |
| J13 AI-down state | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J14 404 / noindex | GAP | GAP | GAP | GAP |
| J15 DR / rollback | PARTIAL: script/manifest contract tests only (R1); no rehearsal | GAP | GAP | GAP |

### admin (apps/admin)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J2 Public browse VI | GAP | GAP | GAP | GAP |
| J3 Magic-link login | GAP | GAP | GAP | GAP |
| J4 Session expiry | GAP | GAP | GAP | GAP |
| J5 Revoke / logout | GAP | GAP | GAP | GAP |
| J6 Replay | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row |
| J7 Wrong tenant/workspace | GAP | GAP | GAP | GAP |
| J8 Dashboard CRUD | GAP | GAP | GAP | GAP |
| J9 Billing/promo sandbox | GAP | GAP | GAP | N/A: production admin must not be driven |
| J10 Mail sink | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J11 AI call under cost cap | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J12 API-down state | GAP | GAP | GAP | GAP |
| J13 AI-down state | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J14 404 / noindex | GAP | GAP | GAP | GAP |
| J15 DR / rollback | PARTIAL: script/manifest contract tests only (R1); no rehearsal | GAP | GAP | GAP |

### docs (apps/docs)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | GAP | GAP | GAP | GAP |
| J2 Public browse VI | GAP | GAP | GAP | GAP |
| J3 Magic-link login | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J4 Session expiry | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J5 Revoke / logout | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J6 Replay | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J7 Wrong tenant/workspace | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J8 Dashboard CRUD | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J9 Billing/promo sandbox | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J10 Mail sink | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J11 AI call under cost cap | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J12 API-down state | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J13 AI-down state | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J14 404 / noindex | GAP | GAP | GAP | GAP |
| J15 DR / rollback | PARTIAL: script/manifest contract tests only (R1); no rehearsal | GAP | GAP | GAP |

### brand-marketplace (apps/brand-marketplace)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | COVERED B-HOME | GAP | COVERED S-RENDER (brand /en heading) | COVERED P-NAV (brand step) |
| J2 Public browse VI | COVERED B-I18N | GAP | GAP | GAP |
| J3 Magic-link login | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J4 Session expiry | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J5 Revoke / logout | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J6 Replay | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J7 Wrong tenant/workspace | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth | N/A: surface has no auth |
| J8 Dashboard CRUD | PARTIAL: B-DETAIL-3 and B-I18N-4 open the inquiry handoff route; submission not exercised | GAP | PARTIAL: S-SESSION covers the Brand handoff | GAP |
| J9 Billing/promo sandbox | COVERED B-DETAIL-2 (Phase 1 checkout disabled) | GAP | GAP | N/A: checkout disabled in Phase 1 |
| J10 Mail sink | GAP | GAP | PARTIAL: S-SESSION handoff only | N/A: production spend/mail/writes barred by no-spend contract (scripts/production-no-spend-contract.test.mjs, not independently reviewed) |
| J11 AI call under cost cap | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J12 API-down state | GAP | GAP | GAP | N/A: cannot induce on production |
| J13 AI-down state | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J14 404 / noindex | PARTIAL: B-DETAIL-4 asserts 404 for an unknown brand; noindex (robots.ts, inquiry pages) not asserted | GAP | GAP | GAP |
| J15 DR / rollback | PARTIAL: script/manifest contract tests only (R1); no rehearsal | GAP | GAP | GAP |

### api (services/api)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J2 Public browse VI | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J3 Magic-link login | COVERED X-AUTH-1, X-REPO-1, X-OAUTH (mocked PG/KV) | GAP | COVERED S-SESSION (bootstrap + exchange) | COVERED P-MAGIC |
| J4 Session expiry | GAP | GAP | GAP | GAP |
| J5 Revoke / logout | COVERED X-AUTH-3 (logout revokes server session) | GAP | COVERED S-SESSION | COVERED P-MAGIC |
| J6 Replay | COVERED X-AUTH-2, X-REPO-2 (single-use jti; refresh family revoked on reuse) | GAP | GAP | GAP |
| J7 Wrong tenant/workspace | PARTIAL: X-TENANT-1/2 test SQL helpers and a role check, not an HTTP request across tenants; X-WS-2 email scope | GAP | PARTIAL: S-SESSION asserts own tenant only | GAP |
| J8 Dashboard CRUD | PARTIAL: X-WS-1 workspace create/get, notification read (mocked storage) | GAP | PARTIAL: S-SESSION profile/preference update + readback | GAP |
| J9 Billing/promo sandbox | PARTIAL: packages/billing 31 tests (price, promo state machine, checkout router) and X-BILL-1; no payment-provider sandbox | GAP | GAP | N/A: production spend/mail/writes barred by no-spend contract (scripts/production-no-spend-contract.test.mjs, not independently reviewed) |
| J10 Mail sink | COVERED X-MAIL-1..5 | GAP | COVERED S-MAIL | N/A: production spend/mail/writes barred by no-spend contract (scripts/production-no-spend-contract.test.mjs, not independently reviewed) |
| J11 AI call under cost cap | COVERED X-AI-1 (cost-cap, budget-cost cases), X-AI-2 | GAP | PARTIAL: S-SESSION one call; cap exhaustion not exercised | PARTIAL: P-MAGIC asserts zero model egress |
| J12 API-down state | COVERED X-DB-1 (504/502 envelopes), X-DB-2 (PG absent fails closed) | GAP | GAP | N/A: cannot induce on production |
| J13 AI-down state | COVERED X-AI-3 (unauthenticated, byte-cap, legacy endpoint fail closed) | GAP | GAP | GAP |
| J14 404 / noindex | PARTIAL: X-404 unknown trust node returns a 404 envelope; X-CORS rejects unlisted origins | GAP | GAP | GAP |
| J15 DR / rollback | PARTIAL: R1 script contract tests only (backup.test.js, restore-test.test.mjs); no restore | GAP | GAP | GAP |

### om-ai web (om-ai.omdala.com/web)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | PARTIAL: OW-SMOKE single smoke spec; NOT RUN (no runnable root script/config) | GAP | GAP | GAP |
| J2 Public browse VI | GAP | GAP | GAP | GAP |
| J3 Magic-link login | PARTIAL: OW-SMOKE 'auth placeholder' only | GAP | GAP | GAP |
| J4 Session expiry | GAP | GAP | GAP | GAP |
| J5 Revoke / logout | GAP | GAP | GAP | GAP |
| J6 Replay | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row |
| J7 Wrong tenant/workspace | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row |
| J8 Dashboard CRUD | GAP | GAP | GAP | GAP |
| J9 Billing/promo sandbox | GAP | GAP | GAP | GAP |
| J10 Mail sink | GAP | GAP | GAP | GAP |
| J11 AI call under cost cap | PARTIAL: OW-SMOKE live web bridge flow | GAP | GAP | GAP |
| J12 API-down state | GAP | GAP | GAP | GAP |
| J13 AI-down state | GAP | GAP | GAP | GAP |
| J14 404 / noindex | GAP | GAP | GAP | GAP |
| J15 DR / rollback | GAP | GAP | GAP | GAP |

### om-ai backend (om-ai.omdala.com/backend)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J2 Public browse VI | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J3 Magic-link login | PARTIAL: OB-AUTH rejects forged header/bearer/body/query identity; no login flow | GAP | GAP | GAP |
| J4 Session expiry | GAP | GAP | GAP | GAP |
| J5 Revoke / logout | GAP | GAP | GAP | GAP |
| J6 Replay | GAP | GAP | GAP | GAP |
| J7 Wrong tenant/workspace | PARTIAL: OB-AUTH internal role/audit actor ignore payload claims | GAP | GAP | GAP |
| J8 Dashboard CRUD | PARTIAL: OB-ROUTES planner/approval/execute/scene flow, in-memory | GAP | GAP | GAP |
| J9 Billing/promo sandbox | PARTIAL: OB-LIVE double-charge avoidance on idempotent session end | GAP | GAP | GAP |
| J10 Mail sink | GAP | GAP | GAP | GAP |
| J11 AI call under cost cap | PARTIAL: OB-LIVE idempotency; OB-SRC no direct provider egress; no cap assertion | GAP | GAP | GAP |
| J12 API-down state | GAP | GAP | GAP | GAP |
| J13 AI-down state | COVERED OB-LIVE realtime/bootstrap fail closed | GAP | GAP | GAP |
| J14 404 / noindex | GAP | GAP | GAP | GAP |
| J15 DR / rollback | GAP | GAP | GAP | GAP |

### om-ai gateway (om-ai.omdala.com/gateway)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J2 Public browse VI | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J3 Magic-link login | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J4 Session expiry | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J5 Revoke / logout | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J6 Replay | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J7 Wrong tenant/workspace | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J8 Dashboard CRUD | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J9 Billing/promo sandbox | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J10 Mail sink | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J11 AI call under cost cap | PARTIAL: OG-1 routes chat only via the OMDALA AIAGENT contract; no cap assertion | GAP | GAP | GAP |
| J12 API-down state | GAP | GAP | GAP | GAP |
| J13 AI-down state | COVERED OG-2 realtime fails closed without authority endpoint | GAP | GAP | GAP |
| J14 404 / noindex | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J15 DR / rollback | GAP | GAP | GAP | GAP |

### om-ai app (om-ai.omdala.com/app, mobile)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J2 Public browse VI | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J3 Magic-link login | PARTIAL: OA-SESSION fail-closed while canonical session bridge absent; no login exists | GAP | GAP | GAP |
| J4 Session expiry | GAP | GAP | GAP | GAP |
| J5 Revoke / logout | PARTIAL: OA-SESSION no authenticated state after logout | GAP | GAP | GAP |
| J6 Replay | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row |
| J7 Wrong tenant/workspace | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row | N/A: server concern; see api row |
| J8 Dashboard CRUD | GAP | GAP | GAP | GAP |
| J9 Billing/promo sandbox | GAP | GAP | GAP | GAP |
| J10 Mail sink | GAP | GAP | GAP | GAP |
| J11 AI call under cost cap | PARTIAL: OA-NATIVE native client refuses calls before network | GAP | GAP | GAP |
| J12 API-down state | PARTIAL: OA-ORIGIN origin policy rejects provider/lookalike origins | GAP | GAP | GAP |
| J13 AI-down state | PARTIAL: OA-NATIVE fail-closed | GAP | GAP | GAP |
| J14 404 / noindex | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J15 DR / rollback | GAP | GAP | GAP | GAP |

### omcode-desktop (apps/omcode-desktop)

| Journey | local-mock | local-integrated | staging | production |
|---|---|---|---|---|
| J1 Public browse EN | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J2 Public browse VI | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J3 Magic-link login | PARTIAL: D-RUNTIME local token auth; not the OMDALA magic-link | GAP | GAP | GAP |
| J4 Session expiry | GAP | GAP | GAP | GAP |
| J5 Revoke / logout | GAP | GAP | GAP | GAP |
| J6 Replay | GAP | GAP | GAP | GAP |
| J7 Wrong tenant/workspace | GAP | GAP | GAP | GAP |
| J8 Dashboard CRUD | PARTIAL: D-RUNTIME files, conflict guard, backup, drafts, approved edits (terminal subtest FAILS on Linux) | GAP | GAP | GAP |
| J9 Billing/promo sandbox | PARTIAL: D-HARD billing fails closed on mismatched run/receipt | GAP | GAP | GAP |
| J10 Mail sink | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J11 AI call under cost cap | PARTIAL: D-CONTRACT egress policy and D-HARD receipt checks; no cap assertion | GAP | GAP | GAP |
| J12 API-down state | COVERED D-REQUEST bounded timeouts, stalled-body recovery | GAP | GAP | GAP |
| J13 AI-down state | COVERED D-LIVE live preflight has no implicit provider/consent | GAP | GAP | GAP |
| J14 404 / noindex | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface | N/A: not applicable to this surface |
| J15 DR / rollback | PARTIAL: D-RELEASE manifest tests; test:ui/native/install/live evidence runners NOT RUN | GAP | GAP | GAP |

## 6. Test ID legend

| ID | Test (file: name) |
|---|---|
| W1 | apps/web/e2e/language-switch.spec.ts: language switch updates nav text EN -> VI |
| A-WELCOME | apps/app/e2e/welcome-smoke.spec.ts: 01..05 (/workspace welcome, open-folder, shortcuts, 200) |
| A-WORKSPACE-02 | apps/app/e2e/workspace-critical.spec.ts: 02 AI Chat accepts input and fails closed without a verified AIAGENT catalog |
| A-WORKSPACE-03 | same file: 03 Language toggle switches EN/VI |
| A-WORKSPACE-05 | same file: 05 Account panel exposes the session-bound AIAGENT authority and fails closed |
| A-401 | apps/app/e2e/auth-dashboard.spec.ts: dashboard / profile / settings redirects when the mocked session endpoint returns 401 (:193, :207, :217) |
| A-DASH | same: dashboard renders persisted account, reality, and AI health contracts (:227) |
| A-FIXTURE | same: unreleased runtime routes never expose fixture records as live data (:248) |
| A-PROFILE | same: profile renders Team 1 account identity contract when session is valid (:264) |
| A-SETTINGS | same: settings renders billing contract and AIAGENT authority when session is valid (:295) |
| B-HOME | apps/brand-marketplace/e2e/home.spec.ts: 5 tests (EN home, brand index, category, locale root, buyer guide) |
| B-I18N | apps/brand-marketplace/e2e/i18n.spec.ts: 4 tests (EN->VI switch, VI listing links, VI category/info, VI inquiry handoff) |
| B-DETAIL-n | apps/brand-marketplace/e2e/brand-detail.spec.ts: 1 full detail boundary; 2 checkout disabled; 3 inquiry handoff route; 4 404 for brand outside public inventory |
| S-RENDER | apps/app/e2e-staging/go-live.spec.ts:78 Web, App, Auth, and Brand render from staging (+ Google start 302/S256) |
| S-MAIL | same:128 contact, access request, and magic-link mail flows reach the configured transport |
| S-SESSION | same:250 signed session, account readback, AIAGENT boundary, Brand handoff, protected App, and logout |
| P-NAV | apps/app/e2e-production/go-live.spec.ts:77 public production navigation remains canonical |
| P-MAGIC | same:130 magic-link exchange verifies session, zero model egress, and logout |
| X-AUTH-1 | services/api/src/auth-session.e2e.test.ts: boots a signed session and exercises protected account APIs |
| X-AUTH-2 | same: consumes magic links once and revokes a refresh family on token reuse |
| X-AUTH-3 | same: revokes the server-side session on logout |
| X-REPO-1/2 | services/api/src/db/auth-repository.test.ts: registers and atomically consumes a magic-link jti once / rotates only the current refresh jti and revokes the whole family |
| X-OAUTH | services/api/src/oauth.test.ts: Google start, callback happy path, invalid state, unbound state, unverified email |
| X-MAIL-1..4 | auth-session.e2e.test.ts: fails closed when staging mail not configured; hands contact mail to transport; fails closed before egress when sink absent; fails closed when receipt omitted. X-MAIL-5: mail-delivery-policy.test.ts: rewrites every staging recipient to one protected sink |
| X-TENANT-1/2 | services/api/src/tenant/guard.test.ts: rejects cross-tenant access for owner; packages/core/src/tenant-isolation.test.ts: blocks cross-tenant access |
| X-WS-1/2 | services/api/src/shared-core-contracts.test.ts: creates a workspace and fetches it by id; protected-runtime-persistence.test.ts: lists persistent workspaces in the authenticated email scope |
| X-BILL-1 | services/api/src/protected-runtime-persistence.test.ts: maps a persistent billing query failure without using in-memory usage |
| X-AI-1/2/3 | services/api/src/aiagent-proxy.test.ts (cost-cap and budget-cost cases :360; unauthenticated, byte-cap, receipt reconciliation) / ai-health.test.ts (no provider egress, legacy endpoint fails closed) |
| X-DB-1/2 | services/api/src/index.v2.db-errors.test.ts: 504 DATABASE_TIMEOUT / 502 DATABASE_UNAVAILABLE; protected-runtime-persistence.test.ts: fails closed when PostgreSQL absent |
| X-404 / X-CORS | services/api/src/index.v2.test.ts: returns 404 envelope for unknown trust node; cors.test.ts, security.test.ts |
| R1 | scripts/*.test.mjs and infra/scripts/restore-test.test.mjs, infra/services/worker/src/__tests__/backup.test.js, scripts/staging-recovery-*.test.mjs, scripts/production-cross-workflow-rollback.test.mjs (contract tests of scripts; none restores real data) |
| OW-SMOKE | om-ai.omdala.com/web/e2e/app-smoke.spec.ts: app MVP smoke |
| OB-AUTH / OB-LIVE / OB-ROUTES / OB-SRC | om-ai.omdala.com/backend/src/{public-auth-boundary,live.routes,routes,ai-authority-source}.test.ts |
| OG-1/2 | om-ai.omdala.com/gateway/src/gateway.test.ts: routes chat only through the OMDALA API AIAGENT contract / fails closed for realtime without authority endpoint |
| OA-SESSION / OA-NATIVE / OA-ORIGIN | om-ai.omdala.com/app/__tests__/sessionStore.test.tsx; __tests_node__/{nativeClientBoundary,apiOriginPolicy}.test.ts |
| D-RUNTIME / D-HARD / D-CONTRACT / D-REQUEST / D-LIVE / D-RELEASE | apps/omcode-desktop/tests/{runtime,hardening,contract,request,live-safety,release}.test.mjs |

## 7. Ranked gap list (highest risk first)

1. **No local-integrated tier (all surfaces).** Auth, tenant and billing behaviour has never run against a real PostgreSQL/D1 plus worker plus UI at this SHA; all 133 API tests and all local Playwright specs use mocks. Risk: a green suite says nothing about SQL, migrations or cookie behaviour. Owner T2 (E2E-2, WO-T2-01/02).
2. **Auth lifecycle negatives incomplete in the API.** Server-side session expiry has no test (J4); replay and revoke are covered only against mocked storage (X-AUTH-2/3); wrong tenant/workspace has helper-level tests but no HTTP cross-tenant request test (J7). Owner T2 (WO-T2-02).
3. **Admin has no authentication/authorization journey or any spec.** `apps/admin` exposes providers, verifications, proofs, offers, nodes and requests pages; nothing asserts an access gate, tenant scoping or noindex. Auth and Docs also have 0 specs. Owner T3 (WO-T3-01/02).
4. **Staging and production specs were not executed by anyone in this wave, and CI does not run on `claude/omdala-*`.** The four staging scenarios and four production checks exist but are NOT_CHECKED here; E2E-3 dry-run is outstanding. Owner T1 (WO-T1-01/02).
5. **AI call under cost cap is proven only at API unit level.** Cap and budget cases exist in `aiagent-proxy.test.ts`, but nothing exercises cap exhaustion end to end, and the Om AI backend/gateway/app suites (about 14 files) were not run, so their coverage is uncounted. Owner TAI/T2.
6. **DR/rollback has script contract tests only.** No local restore rehearsal, byte-compare or capsule dry-run (E2E-5), no staging drill (E2E-9). Owner T1/T2.
7. **404 and noindex are untested on every surface** except one Brand 404 case. Source has `robots.ts` and noindex metadata on app, auth, admin, docs and web, but no test would catch a regression. Owner T3.
8. **User-visible API-down, AI-down and network-loss states mostly untested in UI** (only fail-closed AI states in the app). Owner T3/TAI (E2E-4).
9. **Local-mock specs are not hermetic**: the three 401-redirect specs navigate to the real `auth.omdala.com` and fail offline. Owner T3.
10. **Billing/promo**: pricing and promo state machine are well covered (31 billing tests); there is no payment-provider sandbox flow and no UI CRUD for billing or workspace data. Owner T2/T3.
11. **VI browse is asserted only locally** (web, app toggle, brand); staging and production specs assert English. Owner T3.
12. **Hygiene**: tracked stray test copy (`index.v2.db-errors.test 2.ts`) and four macOS duplicate docs (`* 2.md`); desktop terminal test hardcodes `/bin/zsh`. Owners T2, T0 (docs), T1.
