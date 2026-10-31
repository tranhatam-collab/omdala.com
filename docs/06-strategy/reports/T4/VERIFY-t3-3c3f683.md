# VERIFY T3 head 3c3f683 (claude/omdala-t3-web)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok; Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Delta over verified `054ec10`: WO-T3-07 (hermetic redirect specs), WO-T3-08 (503/504 handling in auth and app), WO-T3-09 (staging policy fix), WO-T3-10 (VI go-live check).

| Claim (T3 reports) | Result |
|---|---|
| `pnpm e2e:app` 23 pass with no network | VERIFIED: 23 passed, 0 failed, 0 skipped, in a sandbox with no outbound access. The three 401-redirect specs that failed in every earlier T4 run now pass |
| `pnpm e2e:auth` 23 pass | VERIFIED: 23 passed |
| `pnpm test:app` 33 pass (3 files) | VERIFIED: 3 files, 33 passed |
| `pnpm typecheck`, `pnpm lint`, `pnpm brand:lint` | VERIFIED: 0, 0, 0 |
| Unchanged suites: `e2e:docs`, `e2e:admin`, `e2e:web` | VERIFIED: 38, 25, 6 passed |
| WO-T3-09: `<repo>/..name` no longer treated as outside the checkout | VERIFIED independently: calling `resolveStagingPlaywrightOutputPolicy` with an output directory `<repo>/..t4probe` now throws "must be outside the candidate checkout" (it was accepted at 7abd962; this closes finding 1 of BL-T4-02) |
| WO-T3-10: staging and production specs assert `/vi/` | Not run (they need protected environments); T3 type-checked them and listed 4 staging tests. NOT_CHECKED |
| `build:all` 0 (T3 reports) | NOT_CHECKED |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run exists for this branch (ci.yml lease not applied; WO-T3-CI BLOCKED) |

Notes: T3 records the web `/vi` `<html lang="en">` finding from WO-T4-08 as BL-T3-05 (not yet fixed on this head). Evidence: VERIFIED_HEAD_ONLY.
