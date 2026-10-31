# VERIFY TAI head 5c8871b (claude/omdala-tai-omai)

- Order: WO-T4-03. Exact SHA in a separate worktree; root frozen-lockfile install ok; `npm ci` in backend, gateway, web and app. Delta over verified `d141c22`: WO-TAI-06 (hermetic web live-card tests), WO-TAI-07 (moderation normalization), WO-TAI-08 (gateway negatives).

| Claim (TAI reports) | Result |
|---|---|
| backend `npm test` 58 pass; `typecheck`; `build` | VERIFIED: 58 pass / 0 fail / 0 skip; typecheck 0; build 0 |
| gateway `npm test` 19 pass; `typecheck`; `build` | VERIFIED: 19 pass / 0 fail / 0 skip; typecheck 0; build 0 |
| web `npm test` 9 pass; `npm run test:e2e` 6 pass; `typecheck`; `build`; `npm audit --audit-level=high` clean | VERIFIED: 9 pass; 6 passed (Chromium via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, no download); typecheck 0; build 0; "found 0 vulnerabilities" |
| app (mobile contract) `npm test` 15 node + 4 jest | VERIFIED: 15 pass / 0 fail; jest 3 suites, 4 tests passed |
| root `pnpm typecheck`, `pnpm lint` | VERIFIED: 0, 0 |
| WO-TAI-07 bypass classes caught, benign text not flagged | VERIFIED with my own probe of `assessText` (13 inputs): spaced letters, full-width, zero-width, Cyrillic look-alike, Vietnamese with and without diacritics flagged; "skill myself", "từ từ thôi", "tu tu" not flagged. Known limits confirmed: leetspeak with a misspelling ("k1ll mysclf") and paraphrase ("ending it all") are not flagged, as `OMAI_MODERATION_SCOPE.md` says |
| web e2e transport kept out of production builds | VERIFIED by the 9 web unit tests (production bundle has no e2e transport) |
| Hosted CI for the exact SHA | NOT_CHECKED for `5c8871b`: T4 read a later run, 41140542834 on `f86bf49`, concluded success; a run on this exact SHA was not read |

Findings: none new. TAI's request to T1 (add web `npm test` and `npm run test:e2e` to the OM AI web CI job) stands. Evidence: VERIFIED_HEAD_ONLY.
