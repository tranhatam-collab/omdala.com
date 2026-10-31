# VERIFY T2 head e464a40 (claude/omdala-t2-core)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok. Delta over verified `93fbd4a`: WO-T2-13 (persistent-auth local stand-up with stub mail sink) and WO-T2-14 (reality scenes/runs persistence, migration staged in `proposed/`).

| Claim (T2 reports) | Result |
|---|---|
| `pnpm test:api` with local PostgreSQL: 436 pass / 0 skip | VERIFIED: 34 files, 436 passed, 0 failed, 0 skipped |
| `pnpm test:api` without a database: 400 pass / 36 skip / 0 fail | VERIFIED on 7 of 8 runs (400 passed, 36 skipped). One run, the first right after the database run, showed 1 failed / 399 passed; the failing test name was not captured and 7 later reruns were clean, so I record one unidentified transient failure (timing under load suspected; T2 had already hardened mail tests for load in b794619) |
| `pnpm typecheck`, `pnpm lint`, `pnpm test:core`, `pnpm --filter @omdala/api run check` | VERIFIED: exit 0 each |
| `pnpm test:release-governance` 394 pass (WO-T2-14) | VERIFIED: 394 pass, 0 fail, 0 skip |
| `local:smoke` persistent profile (WO-T2-13): link request via stub sink, exchange, link and session rows in PostgreSQL, session valid after worker restart, replay refused (401), refresh 200 | VERIFIED: exit 0, output "local-stack smoke [persistent]: /health 200; magic-link request 201 (stub mail sink); session exchange 200; link and session persisted in PostgreSQL; session valid after worker restart; replayed link refused; refresh 200" |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41134477311 "OMDALA CI" on e464a40 concluded success |

Migration claims (WO-T2-14) are checked in WO-T4-11. Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI).
