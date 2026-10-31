# VERIFY T2 head 0f8197a (claude/omdala-t2-core)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok. Delta over verified `3566a14`: WO-T2-20 (per-tenant daily AI cost cap, migration 0005 staged) and WO-T2-21 (Om AI session bridge credential behind the release boundary, migration 0006 staged).

| Claim (T2 reports) | Result |
|---|---|
| `pnpm test:api` with local PostgreSQL: 583 pass / 0 skip | VERIFIED: 41 files, 583 passed, 0 failed, 0 skipped |
| `pnpm test:api` without a database: 520 pass / 63 skip | VERIFIED on 2 runs: 520 passed, 63 skipped, 0 failed |
| `pnpm typecheck`, `pnpm lint`, `pnpm test:core`, `pnpm --filter @omdala/api run check` | VERIFIED: exit 0 each |
| `pnpm test:release-governance` 394 pass | VERIFIED: 394 pass / 0 fail |
| Cap is atomic under concurrency, never over-admits (real PostgreSQL) | Passed in the 583-test run; T4's own attack on the released-key replay path found a bypass, see WO-T4-14 (**FAILED, High**) |
| Bridge credential: 501 in staging, production and unset | VERIFIED independently, see WO-T4-14 |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41153128315 "OMDALA CI" on 0f8197a concluded success |

Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI). The cap bypass is a defect in code that CI and the unit tests do not cover.
