# Team 1 Cross-Team Defect Register

Date: 2026-08-09

Owner: Team 1 audit and release control

Verdict: `HOLD`

This register assigns defects by implementation ownership. Team 1 validates closure independently and does not accept narrative completion claims.

## P0 defects

| ID | Owner | Defect | Current evidence | Required closure receipt |
|---|---|---|---|---|
| P0-01 | Team 2 | Data architecture contradicts governance | `G1_3_DECISION_LOCK.md` says D1 only; `services/api/src/db/client.ts` requires `HYPERDRIVE` or `DATABASE_URL`; Wrangler declares neither | Approved ADR, one implementation, staging migration, rollback and tenant-isolation receipt |
| P0-02 | Team 2 | API public runtime is unavailable | Both `/v2/reality/nodes` and `/v2/live/personas` timed out after 20 seconds | Exact deployed SHA, semantic API probe and alert evidence |
| P0-03 | Team 2 | OM AI backend has 5 High advisories | Fastify, find-my-way, fast-uri, brace-expansion and static Swagger chain | Lockfile diff, build, 11/11 tests and zero-High npm audit |
| P0-04 | Team 2 | Infra API Gateway has 5 High advisories | Same Fastify and Swagger dependency family | Lockfile diff, 23/23 tests and zero-High npm audit |
| P0-05 | Team 3 | Brand Exchange is not deployed | Source build 47 routes and E2E 13/13 pass; `brand.omdala.com` is NXDOMAIN | Candidate SHA, staging URL, DNS/TLS, EN/VI E2E, monitoring and rollback receipt |
| P0-06 | Team 4 | App candidate is not the public runtime | Local App E2E 16/16 pass; public `/workspace/` is 404 | Exact-SHA App deployment and browser receipt against public staging |
| P0-07 | Team 4 | Auth surface returns semantic error | HTTP 200 document contains `next_error` | Login, callback, session persistence and logout E2E on staging |
| P0-08 | Teams 2-4 | Lint gate is red | 73 errors and 148 warnings across 63 files | Zero-error, zero-warning `pnpm lint` receipt on candidate SHA |

## Lint ownership split

| Path group | Files with findings | Errors | Warnings | Primary owner |
|---|---:|---:|---:|---|
| `apps/app` | 32 | 39 | 114 | Team 3 and Team 4 |
| `packages/core` | 9 | 12 | 18 | Team 2 and Team 4 |
| `services/api` | 4 | 4 | 14 | Team 2 |
| `apps/docs` | 6 | 6 | 0 | Team 3 |
| `apps/admin` | 3 | 3 | 0 | Team 3 |
| `services/auth` | 2 | 3 | 0 | Team 2 |
| `packages/ui` | 2 | 3 | 0 | Team 3 |
| `apps/auth` | 2 | 1 | 1 | Team 2 and Team 3 |
| `apps/web` | 2 | 1 | 1 | Team 3 |
| `packages/types` | 1 | 1 | 0 | Team 2 |

Rule totals from the current lint JSON:

- `@typescript-eslint/no-explicit-any`: 129
- `@typescript-eslint/no-unused-vars`: 37
- `react-hooks/set-state-in-effect`: 29
- `react-hooks/exhaustive-deps`: 15
- `@typescript-eslint/no-require-imports`: 3
- remaining rules: 8

No team may solve this by lowering severity, raising `--max-warnings`, excluding owned source or adding `continue-on-error`.

## Team audit status

### Team 1 - source, CI and release control

Pass:

- clean candidate with exact ancestry
- Team 3 and Team 4 integrated
- root build, unit and three browser suites pass
- root audit has zero High and Critical
- nested audits now visible in CI

Open:

- commit and publish the Team 1 receipt candidate
- obtain CI results for the published SHA
- keep release workflow blocked until data binding and downstream gates close
- produce exact-SHA staging and rollback evidence after approval

True state: `FOUNDATION_READY_DOWNSTREAM_HOLD`

### Team 2 - API, auth, data, billing and AI persistence

Pass:

- API 47/47
- D1 tenant isolation 7/7
- OM AI backend 11/11 and gateway 9/9
- Infra API Gateway 23/23 and Worker 10/10

Fail or blocked:

- conflicting D1-only versus PostgreSQL/Hyperdrive architecture
- no Worker binding in source
- API public runtime timeout
- auth semantic failure
- 10 High findings across two Fastify runtimes
- no real authenticated session, migration, rollback or persistence staging receipt

True state: `CODE_TESTS_PASS_ARCHITECTURE_AND_RUNTIME_FAIL`

### Team 3 - Web, App product and Brand Exchange

Pass:

- Brand core 33/33
- Brand Exchange build 47 routes
- Brand Exchange E2E 13/13
- Web language E2E 1/1
- committed candidate integrated with clean ancestry

Fail or blocked:

- Brand Exchange is not deployed and has no DNS
- authenticated public inquiry to App workflow is not proven
- full Brand Asset Lifecycle modules are not complete
- product-owned lint remains red
- no staging SEO, accessibility or private inventory release receipt

True state: `PHASE1_PUBLIC_SOURCE_PARTIAL_RUNTIME_NOT_DEPLOYED`

### Team 4 - OMCODE, OM AI surfaces, Omone and Omniverse

Pass:

- App E2E 16/16 on the integrated static export
- OM AI backend and gateway unit suites pass
- Omniverse is formally parked from go-live scope
- Omone separate PR and unit evidence exist

Fail or blocked:

- public `/workspace/` is 404
- OM AI public API routes time out and the public product is not proven
- Omone PR is not integrated or released from an approved exact SHA
- real auth, persistence, provider, metering and billing journeys are not proven
- product-owned lint remains red

True state: `LOCAL_CODE_PASS_PUBLIC_RUNTIME_FAIL`

## Closure order

1. Team 2 selects and implements one approved data architecture.
2. Team 2 removes all nested High advisories and restores semantic staging API/auth.
3. Teams 2-4 close their lint findings without weakening policy.
4. Team 3 publishes Brand Exchange to staging and proves EN/VI buyer and inquiry journeys.
5. Team 4 publishes App and OM AI candidates to staging and proves real auth and persistence.
6. Team 1 runs full CI, source/deploy identity, runtime, monitoring and rollback gates.
7. Independent QA reviews one immutable candidate SHA.
8. Founder reviews evidence and separately authorizes production.

## Hard stop

No production deploy, DNS mutation, database migration or payment activation is authorized by this register.
