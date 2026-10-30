# VERIFY T2 head 93fbd4a (claude/omdala-t2-core)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok. Delta over verified `131b5d4`: WO-T2-10 (models route failure mapping), WO-T2-11 (contract doc), WO-T2-12 (local stand-up and smoke), self-contained TLS test, staging mail sink policy test.

| Claim (T2 reports) | Result |
|---|---|
| `pnpm test:api` with local PostgreSQL, 0 fail | VERIFIED: 32 files, 415 passed, 0 failed, 0 skipped. The TLS verification negative that failed in the two previous VERIFY reports now passes (`db/tls-verification.test.ts` uses a throwaway certificate) |
| `pnpm test:api` without a database | VERIFIED: 28 files passed, 4 skipped; 388 passed, 27 skipped, 0 failed |
| `pnpm typecheck`, `pnpm lint`, `pnpm test:core`, `pnpm --filter @omdala/api run check` | VERIFIED: exit 0 each |
| `local:smoke` (WO-T2-12): /health 200, magic-link request 201, session exchange 200, seeded profile read from PostgreSQL | VERIFIED: `OMDALA_LOCAL_PG_URL=<scratch loopback server> pnpm --filter @omdala/api run local:smoke` exit 0 with the output line quoted in the report; wrangler ran `--local` (a console-mail warning only) |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41112163135 "OMDALA CI" on 93fbd4a concluded success |

Notes: the smoke runs with `ENVIRONMENT=development` (T2 states it: sessions in memory there), so it is a local-integrated check of the Worker plus PostgreSQL profile reads, not of persistent auth. T2's own proposed next order (staging-mode local profile with a stub mail sink) stands. Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI).
