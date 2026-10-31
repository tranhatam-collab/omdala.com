# VERIFY TAI head f86bf49 (claude/omdala-tai-omai)

- Order: WO-T4-03. Exact SHA in a separate worktree; root frozen-lockfile install ok; `npm ci` in backend, gateway, web. Delta over verified `5c8871b`: WO-TAI-09 (docs corrected to say the keyword screen is not a classifier) and WO-TAI-10 (live API contract tests and contract-vs-code matrix).

| Claim (TAI reports) | Result |
|---|---|
| backend `npm test` 69 pass (was 58); `typecheck`; `build` | VERIFIED: 69 pass / 0 fail / 0 skip; typecheck 0; build 0 |
| gateway `npm test` 19 pass | VERIFIED: 19 pass |
| web `npm test` 9 pass; `npm run test:e2e` 6 pass | VERIFIED: 9 pass; 6 passed |
| root `pnpm typecheck`, `pnpm lint` | VERIFIED: 0, 0 |
| WO-TAI-09: docs-only edit of six Markdown files | VERIFIED by `git diff --stat 5c8871b..f86bf49`: the six named docs changed (7 insertions, 4 deletions across them); no code in that order |
| WO-TAI-10: 30 documented endpoints, 17 implemented, 13 missing; matrix lists each with test | Matrix table read and spot-checked (personas, sessions, realtime, memory rows agree with `live.contract.test.ts`); the 10 new contract tests pass. Full recount of routes not performed |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41140542834 "OMDALA CI" on f86bf49 concluded success |

Findings: the contract documents and the code disagree on the response envelope key order and on `status` values (`created` vs `blocked`), per TAI's matrix; T0 chose to align the documents (TAI's later WO-TAI-11 commit, not verified here). Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI).
