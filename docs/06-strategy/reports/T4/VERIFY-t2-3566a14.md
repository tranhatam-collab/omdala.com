# VERIFY T2 head 3566a14 (claude/omdala-t2-core)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok. Delta over verified `2c48d55`: WO-T2-17 (Om AI session bridge contract draft, docs), WO-T2-18 (local journey support: staging public origins, rate-limit reset), WO-T2-19 (characterization of the missing AI usage cap).

| Claim (T2 reports) | Result |
|---|---|
| `pnpm test:api` with local PostgreSQL: 506 pass / 0 skip | VERIFIED: 38 files, 506 passed, 0 failed, 0 skipped |
| `pnpm test:api` without a database: 460 pass / 46 skip / 0 fail | VERIFIED on 2 runs: 460 passed, 46 skipped, 0 failed |
| `pnpm typecheck`, `pnpm lint`, `pnpm test:core`, `pnpm --filter @omdala/api run check` | VERIFIED: exit 0 each |
| `pnpm test:release-governance` 394 pass | VERIFIED: 394 pass / 0 fail |
| WO-T2-18: smoke in persistent and development profiles and with `--public-origins=staging` | VERIFIED: `local:smoke` exit 0 for all three |
| WO-T2-19 characterization tests fail if a cap is added | VERIFIED by mutation, see WO-T4-13 |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41147489602 "OMDALA CI" on 3566a14 concluded success |

Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI).
