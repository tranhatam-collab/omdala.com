# VERIFY TAI head 984f640 (claude/omdala-tai-omai)

- Order: WO-T4-03. Exact SHA in a separate worktree; root frozen-lockfile install ok; `npm ci` in backend, web, app. Delta over verified `c8a2be8`: WO-TAI-17 (Vietnamese copy with diacritics, API errors mapped to bilingual messages).

| Claim (WO-TAI-17 report) | Result |
|---|---|
| web `npm test` 17 pass (3 new, including the diacritics guard) | VERIFIED: 17 pass / 0 fail |
| web `npm run test:e2e` 26 pass; `typecheck`; `build` | VERIFIED: 26 passed; typecheck 0; build 0 |
| backend `npm test` 107 pass; `typecheck`; `build` | VERIFIED: 107 pass / 0 fail / 0 skip; typecheck 0; build 0 |
| app (mobile contract) 15 node + 4 jest | VERIFIED: 15 pass; jest 4 tests passed |
| root `pnpm typecheck`, `pnpm lint` | VERIFIED: 0, 0 |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41165956579 "OMDALA CI" on 984f640 concluded success |

Open (TAI states it): the Vietnamese strings need a native-speaker review; T4 cannot judge them. Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI).
