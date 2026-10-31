# VERIFY T2 head 1f1d5323505e6e233dbe16cd1c926cafbccf3f5a (claude/omdala-t2-core)

- Order: WO-T4-03. Examined in a separate worktree at the exact SHA, `pnpm install --frozen-lockfile` ok. Node v22.22.0.
- Covers T2 orders WO-T2-01/02/03/04, BL-T2-01/02 and the CI lease commit as far as listed below.

| Claim (source) | Result |
|---|---|
| `pnpm typecheck` 0 errors; `pnpm --filter @omdala/api run check` 0 errors; `pnpm lint` pass (T2 reports) | VERIFIED: exit 0 each |
| `pnpm test:api` without DB: 348 pass / 21 skip / 0 fail (BL-T2-02) | VERIFIED: 25 files passed, 3 skipped; 348 passed, 21 skipped |
| `pnpm test:api` with local PostgreSQL: 369 pass / 0 skip (BL-T2-02) | FAILED, 1 test: 368 pass, 1 fail. `db/auth-repository.integration.test.ts` "verifies the server certificate by default (self-signed server is refused)" resolved instead of rejecting. Cause on this runner: my scratch server (the container's Ubuntu cluster, snakeoil certificate) is accepted by a verifying client (probe: `ssl:{rejectUnauthorized:true}` connected). So the negative cannot run on a server whose certificate the client trusts; test depends on the server certificate setup, not shown to be a product defect. Suggest T2 make the test self-provision an untrusted certificate or skip with an explicit reason when the server's certificate verifies. |
| `pnpm test:core` 15 pass (BL-T2-01/02) | VERIFIED: 15 passed |
| 6 PostgreSQL bootstrap tests (WO-T2-01) | VERIFIED at the earlier head 163c280 (6 passed against a local PostgreSQL 16 cluster); same file included in the 369-count run above (passed) |
| R-04 redirect hardening, `stub.ts` normalizePath (WO-T2-02) | VERIFIED at 163c280 by direct call: protocol-relative, backslash, encoded protocol-relative, space and absolute URL inputs all return the fallback; `/ok?x=1` kept. `stub.ts` unchanged between 163c280 and 1f1d532 |
| R-03 certificate verification by default, `OMDALA_DB_TLS_INSECURE=1` allowed only in local/development/test (WO-T2-04) | VERIFIED by reading `services/api/src/db/client.ts` (`resolveDbSsl`) and `db/client.test.ts` passing (21 tests per T2; included in the 348 pass) |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41083582346 "OMDALA CI" on 1f1d532, all 25 jobs concluded success (includes API Tests, App Playwright E2E, Lint, TypeScript Check, Security Scan, Release Governance) |

Local scratch database: the container's PostgreSQL 16 cluster on 127.0.0.1 with a throwaway password set for this run; no remote system touched.

Findings
1. Test-environment dependence above (T2 owns `services/api/src/db/auth-repository.integration.test.ts`).
2. Evidence level: VERIFIED_HEAD_ONLY for local results, VERIFIED_CURRENT for CI.
