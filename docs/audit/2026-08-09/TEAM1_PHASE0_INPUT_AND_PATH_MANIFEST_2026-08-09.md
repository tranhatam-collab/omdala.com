# Team 1 Phase 0 Input And Path Manifest

Date: 2026-08-09

Status: `INTEGRATED_LOCAL_CANDIDATE`

Scope: OMDALA canonical source recovery only.

## Target

- Checkout: `.team1/integration-20260809`
- Branch: `OMCODE/integration-web-brand-beta-20260809`
- Starting HEAD: `aa87e06f7b6affbe6921e69235a1eb996107f589`
- Starting remote branch: `origin/OMCODE/team4-omone-omai-omcode-omniverse-v2-20260728`
- Common Team 1 base: `fc970abc574e956ed067c9c5c5e1ea22fefd09db`

## Approved inputs

| Input | SHA | State | Purpose |
|---|---|---|---|
| Team 1 release foundation | `fc970abc574e956ed067c9c5c5e1ea22fefd09db` | Remote | Node 22 and fail-closed release baseline |
| Team 4 candidate | `aa87e06f7b6affbe6921e69235a1eb996107f589` | Remote | OMCode E2E, OM AI gateway tests and Omniverse park ADR |
| Team 3 candidate | `6f93373247f9ff12958be6d5356586088f7d5fe6` | Local clean commit | Brand Exchange runtime candidate |

Omone remains a separate repository and is not imported into this monorepo candidate.

## Team 3 approved path set

- `apps/brand-marketplace/**`
- `packages/brand-core/**`
- `apps/app/app/(dashboard)/brands/**`
- `apps/app/lib/static-params.ts`
- `apps/app/next.config.mjs`
- `package.json`
- `pnpm-lock.yaml`

## Team 3 excluded paths

- `apps/brand-marketplace/test-results 2/**`
- all Playwright output directories
- all `.next`, `out`, coverage and cache directories
- all duplicate files with Finder suffixes such as ` 2` or ` 3`
- all untracked files outside commit `6f93373247f9ff12958be6d5356586088f7d5fe6`

## Team 4 inherited path set

The starting HEAD already contains the reviewed Team 4 delta from `fc970a`:

- `.github/workflows/ci.yml`
- `apps/app/app/(dashboard)/profile/page.tsx`
- `apps/app/app/(dashboard)/settings/page.tsx`
- `apps/app/app/workspace/**`
- `apps/app/e2e/**`
- `docs/adr/0001-omniverse-park.md`
- `docs/audit/2026-07-31/TEAM4_FINAL_RECEIPT_V2.md`
- `om-ai.omdala.com/gateway/package.json`
- `om-ai.omdala.com/gateway/src/gateway.test.ts`

## Import method

1. Fetch the exact Team 3 commit from the local clean Team 3 repository.
2. Verify its parent is the Team 1 base `fc970a`.
3. Cherry-pick only commit `6f93373247f9ff12958be6d5356586088f7d5fe6`.
4. Stop on any conflict and compare the affected file against both source candidates.
5. Verify that the resulting changed paths match the approved path set.
6. Run source integrity, typecheck, tests, builds, lint and E2E from the integrated candidate.

## Import result

- Team 3 parent verification: `6f93373247f9ff12958be6d5356586088f7d5fe6^` equals `fc970abc574e956ed067c9c5c5e1ea22fefd09db`.
- Cherry-pick result: clean, no conflict.
- Integrated commit: `ffc3d57031c10e95b8b7c0e20cbd99fd12177b84`.
- Generated Playwright output was excluded from source and moved outside the checkout.
- Team 1 changes after the import are documented in `TEAM1_PHASE0_EXECUTION_RECEIPT_2026-08-09.md`.

## Current known CI state before integration

Pull request 7 at `aa87e06`:

- required TypeScript, unit, API, core, infra, OM AI, app E2E, builds and security checks: `PASS`
- Lint: `FAIL`
- Web Playwright E2E: `FAIL`
- merge state: `UNSTABLE`

These failures remain open until reproduced and fixed on the new integrated candidate.

## Prohibited actions

- no production deploy
- no DNS or database mutation
- no broad copy from the broken primary workspace
- no import of untracked Team 3 files
- no claim that local tests close Team 4 release gates
- no force push

## True state

`SOURCE_INPUTS_IDENTIFIED`

`PATH_SCOPE_LOCKED`

`TEAM3_IMPORT_APPLIED`

`LOCAL_BROWSER_E2E_PASS`

`CI_REMAINS_BLOCKED_BY_LINT_AND_NESTED_HIGH_ADVISORIES`

`HOLD`
