# VERIFY TAI head c8a2be8 (claude/omdala-tai-omai)

- Order: WO-T4-03. Exact SHA in a separate worktree; root frozen-lockfile install ok; `npm ci` in backend, web, app. Delta over verified `63d0141`: WO-TAI-15 (locale-aware `lang`, language switcher, contrast checks) and WO-TAI-16 (bridge runtime negatives for introspection and published-key adapters).

| Claim (TAI reports) | Result |
|---|---|
| backend `npm test` 107 pass / 0 fail / 0 skip (was 81); `typecheck`; `build` | VERIFIED: 107 pass; typecheck 0; build 0 |
| web `npm run test:e2e` 26 pass (14 new); `npm test` 14 pass; `typecheck`; `build`; `npm audit --audit-level=high` | VERIFIED: 26 passed; 14 pass / 0 fail; typecheck 0; build 0; "found 0 vulnerabilities" |
| app (mobile contract) 15 node + 4 jest | VERIFIED: 15 pass; jest 4 tests passed |
| root `pnpm typecheck`, `pnpm lint` | VERIFIED: 0, 0 |
| Bridge adapters are not wired into the server | VERIFIED: no `bridge/` import in `app.ts`, `server.ts`, `index.ts`, `routes.ts` or `publicBoundary.ts` |
| Hosted CI for the exact SHA | VERIFIED_CURRENT: run 41161936419 "OMDALA CI" on c8a2be8 concluded success |

Open: TAI's scope names, 3600 s cap and `iss` handling are assumptions to confirm against T2's producer (900 s lifetime, `session:read`-style scopes); WO-TAI-17 (Vietnamese diacritics) is already on the branch and needs a native-speaker review. Evidence: VERIFIED_HEAD_ONLY (local), VERIFIED_CURRENT (CI).
