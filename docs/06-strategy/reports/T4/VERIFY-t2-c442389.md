# VERIFY T2 head c442389 (claude/omdala-t2-core)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok. Delta over verified `5c7c84e`: WO-T2-26 (DR rehearsal over proposed migrations 0004-0007) and WO-T2-25 (billing flow map, webhook signature fix, billing tests).

| Claim (T2 reports) | Result |
|---|---|
| `pnpm test:api` with local PostgreSQL: 614/614 | VERIFIED: 44 files, 614 passed, 0 failed, 0 skipped |
| `pnpm test:api` without a database: 535 pass / 79 skip | VERIFIED on 2 runs: 535 passed, 79 skipped, 0 failed |
| `pnpm typecheck`, `pnpm lint`, `pnpm test:core`, api check | VERIFIED: exit 0 each |
| `pnpm test:release-governance` 394 pass; packages/billing 31 pass | VERIFIED: 394 pass / 0 fail; billing 31 pass / 0 fail |
| `verifyWebhookSignature` no longer throws for every input | VERIFIED by reading `security.ts:101-128`: fails closed on a bad algorithm, empty secret or non-hex signature, uses `HMAC`/`SHA-256`, returns the verify result; the unauthenticated route still answers 200 (see WO-T4-17) |
| DR rehearsal covers 22 tables incl. the new ones, cap counter and revocation state survive restore | Passed as part of the 614-test run (real PostgreSQL); T4 did not repeat the one-byte negative control for this version |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41166231902 "OMDALA CI" on c442389 concluded success |

Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI).
