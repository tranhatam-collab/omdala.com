# VERIFY T2 head 5c7c84e (claude/omdala-t2-core)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok. Delta over verified `065b716`: WO-T2-24 (cost-cap replay fix, refresh/magic-link/exchange messages made fixed text). T2's branch has since moved on (WO-T2-25 at `c442389`, WO-T2-26 at `476749a`).

| Claim (WO-T2-24 report) | Result |
|---|---|
| `pnpm test:api` with local PostgreSQL: 598/598 | VERIFIED: 42 files, 598 passed, 0 failed, 0 skipped |
| `pnpm test:api` without a database: 528 pass / 70 skip | VERIFIED on 2 runs: 528 passed, 70 skipped, 0 failed |
| `pnpm typecheck`, `pnpm lint`, `pnpm test:core`, api check | VERIFIED: exit 0 each |
| `pnpm test:release-governance` 394 pass | VERIFIED: 394 pass / 0 fail |
| Any reused key answers 409 before the provider, in every ledger state | VERIFIED by my own attack, see WO-T4-15 (0 provider executions from 5 released-key replays; 40 parallel new keys admit exactly 4 at cap 1.00; same key x10 in parallel runs once) |
| Refresh 500 no longer echoes an internal message | VERIFIED by reading `index.ts` near 3764 (fixed text) |
| Hosted CI for the exact SHA | NOT_CHECKED for the run on 5c7c84e itself (not located); later runs on the same branch (WO-T2-22 `fe6b42e`, `476749a`, `c442389`) concluded success and contain this code |

Evidence: VERIFIED_HEAD_ONLY.
