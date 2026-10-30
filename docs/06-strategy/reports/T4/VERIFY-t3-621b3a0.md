# VERIFY T3 head 621b3a0 (claude/omdala-t3-web)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok; Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Delta over `2b35cfc`: WO-T3-04 (one robots source per app, language switchers keep query and hash, auth switcher, `packages/ui` location hooks).

| Claim (WO-T3-04 report) | Result |
|---|---|
| `pnpm typecheck` 0, `pnpm lint` 0, `pnpm brand:lint` 0 | VERIFIED: 0, 0, 0 |
| `pnpm e2e:auth` 17 pass | VERIFIED: 17 passed, 0 failed, 0 skipped |
| `pnpm e2e:docs` 23 pass | VERIFIED: 23 passed |
| `pnpm e2e:admin` 25 pass | VERIFIED: 25 passed |
| `pnpm e2e:web` pass | VERIFIED: 2 passed |
| `pnpm e2e:app` 16 pass, 3 fail (401 redirect tests, sandbox cannot reach auth.omdala.com) | VERIFIED: 16 passed, 3 failed, the same three specs `auth-dashboard.spec.ts:193/:207/:217`; failure is `toHaveURL` on `chrome-error://`, consistent with no outbound access (same as the 2b35cfc and 7abd962 baselines) |
| `pnpm build:all` 0 | NOT_CHECKED by T4 |
| R-07/R-10/R-13/R-17 single robots source; R-21 switchers keep query | VERIFIED by diff: `public/robots.txt` removed for admin, app, docs; switchers use the new suffix hook; robots/switcher specs pass |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run exists for this branch (ci.yml on it still lacks `claude/omdala-**`; WO-T3-CI blocked) |

Findings: the 3 app specs remain non-hermetic (they need the real auth origin); WO-T3-05 touches that file. CI gap persists. Evidence: VERIFIED_HEAD_ONLY.
