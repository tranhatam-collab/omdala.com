# VERIFY T2 head 3988b4c (claude/omdala-t2-core)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok. Delta over the verified `1f1d532`: flaky-test fix (`failure-states.test.ts`), DR rehearsal test (`postgres-dr-rehearsal.integration.test.ts`, BL-T2-05), reports.

| Claim (T2 BL-T2-05 report) | Result |
|---|---|
| `pnpm test:api` without DB: 348 pass / 27 skip / 0 fail | VERIFIED: 25 files passed, 4 skipped; 348 passed, 27 skipped |
| `pnpm test:api` with local PostgreSQL: 375 pass / 0 skip / 0 fail | FAILED, same single test as in VERIFY-t2-1f1d532: 374 pass, 1 fail (`db/auth-repository.integration.test.ts` "verifies the server certificate by default"). Environmental: the scratch server certificate is accepted by a verifying client here. The 6 DR rehearsal tests passed |
| `pnpm typecheck`, `pnpm lint`, `pnpm --filter @omdala/api run check` | VERIFIED: exit 0 each |
| DR negative control (one-byte change fails the hash comparison) | NOT_CHECKED by T4 (not re-driven) |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41084808189 "OMDALA CI" on 3988b4c concluded success |

Findings: none new. Open from before: make the TLS integration test self-provisioning (T2). Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI).
