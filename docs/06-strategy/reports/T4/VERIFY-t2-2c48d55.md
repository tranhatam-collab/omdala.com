# VERIFY T2 head 2c48d55 (claude/omdala-t2-core)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok. Delta over verified `e464a40`: WO-T2-15 (local-stack teardown and mail pinning, flaky mail test fix), WO-T2-16 (tenant isolation for account and workspace routes).

| Claim (T2 reports) | Result |
|---|---|
| `pnpm test:api` with local PostgreSQL: 476 pass / 0 skip | VERIFIED: 36 files, 476 passed, 0 failed, 0 skipped |
| `pnpm test:api` without a database: 431 pass / 45 skip / 0 fail | VERIFIED on 2 runs: 431 passed, 45 skipped, 0 failed (T2's WO-T2-15 report says 400/40 for its own earlier base; the 431/45 figure is the WO-T2-16 report's) |
| `pnpm typecheck`, `pnpm lint`, `pnpm test:core`, `pnpm --filter @omdala/api run check` | VERIFIED: exit 0 each |
| `pnpm test:release-governance` 394 pass | VERIFIED: 394 pass / 0 fail |
| WO-T2-15: smoke in both profiles with the stub sink and pinned mail settings | VERIFIED: `local:smoke` exit 0 for `--profile=persistent` and `--profile=development` (both end with the stub-sink mail-api transport) |
| WO-T2-15: wrangler does not read `.dev.vars` when `--env-file` is used (the WO-T4-09 finding 3 risk) | VERIFIED by my own canary: I planted `services/api/.dev.vars` with a fake `MAIL_API_KEY` and `MAIL_DELIVERY_MODE=direct`; `local:smoke` still passed with the stub sink and no external mail (file removed afterwards). This closes finding 3 for this version |
| WO-T2-15: every failure path tears down (WO-T4-09 finding 1) | VERIFIED: forced a busy-port failure ("wrangler exited early with code 1"); afterwards 0 `omdala_local_*` databases and 0 `omdala-local-stack-*` temp directories remained (same counts before) |
| WO-T2-16: tenant isolation tests (31 mocked + 5 real SQL) and three defects fixed | VERIFIED as part of the 476-test run (the 5 real-SQL tests ran, none skipped). The three fixes were not reverted by T4 (T2 states it did) |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41142759435 "OMDALA CI" on 2c48d55 concluded success |

Open for T0 (from T2's report): the service-token mint endpoint creates tokens that nothing verifies and API keys that are never stored (inert features); `POST /v1/analytics/track` can now answer 404 `workspace_not_found`, not yet in the contract document. Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI).
