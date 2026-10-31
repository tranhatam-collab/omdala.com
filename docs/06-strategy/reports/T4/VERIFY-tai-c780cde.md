# VERIFY TAI head c780cde (claude/omdala-tai-omai)

- Order: WO-T4-03. Exact SHA in a separate worktree; root frozen-lockfile install ok; `npm ci` in backend, app and web. Delta over verified `bcb3034`: WO-TAI-12 (consumer-side session bridge contract tests, not wired) and WO-TAI-13 (client and extension specs aligned with the code, docs only).

| Claim (TAI reports) | Result |
|---|---|
| backend `npm test` 81 pass (was 69) | VERIFIED: 81 pass / 0 fail / 0 skip; typecheck 0 |
| app (mobile contract) `npm test` | VERIFIED: 15 node pass; jest 3 suites / 4 tests passed |
| web `npm test` 9 pass; `npm run test:e2e` 6 pass | VERIFIED: 9 pass; 6 passed |
| root `pnpm typecheck`, `pnpm lint` | VERIFIED: 0, 0 |
| `bridge/consumer.ts` is not wired into the app | VERIFIED: no non-test import of `bridge/consumer` under `backend/src` |
| WO-TAI-13 changed docs only (5 files) | VERIFIED by `git diff --stat bcb3034..c780cde`: five Markdown specs plus the two new TAI files and the consumer module/test |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41152194293 "OMDALA CI" on c780cde concluded success |

Note: TAI says the consumer's scope names (`om_ai.live:*`), the 3600 s cap and replay-until-exp are assumptions; T2's producer uses `session:read`-style scopes and a 900 s lifetime (WO-T2-21), so the two do not match yet. Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI).
