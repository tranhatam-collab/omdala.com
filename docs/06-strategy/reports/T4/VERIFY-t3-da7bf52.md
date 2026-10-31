# VERIFY T3 head da7bf52 (claude/omdala-t3-web)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok; Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Delta over verified `e967a33`: WO-T3-16 (legacy sign-in skeleton removed, `/sign-in` redirects to `/login`, built-bundle env inlining test).

| Claim (WO-T3-16 report) | Result |
|---|---|
| `pnpm test:inlined-env` 11 pass (4 scanner, 1 sweep, 6 app builds) | VERIFIED: 11 tests, 11 pass, 0 fail |
| `pnpm typecheck`, `pnpm lint`, `pnpm brand:lint` | VERIFIED: 0, 0, 0 |
| `pnpm test:app` 35 pass | VERIFIED: 35 passed |
| `pnpm e2e:app` 38 pass, 1 skipped (local-stack journey) | VERIFIED: 38 passed, 1 skipped, 0 failed (includes the new `/sign-in` redirect spec) |
| Unchanged: `e2e:web`, `e2e:docs`, `e2e:auth`, `e2e:admin` | VERIFIED: 31, 48, 27, 25 passed |
| The scanner fails on the WO-T4-12 defect class | VERIFIED by mutation in the scratch worktree (reverted): changing `process.env.NEXT_PUBLIC_API_URL` back to `process?.env?.NEXT_PUBLIC_API_URL` in `apps/app/lib/api-client.ts` made `test:inlined-env` fail ("app: every NEXT_PUBLIC_ lookup is inlined and no origin falls back to production") with three un-inlined lookups listed |
| Orphaned sign-in skeleton (localhost default API) removed | VERIFIED by diff: `apps/app/app/sign-in/page.js`, `components/{app-frame,app-nav,live-api-panel,magic-link-form}.js`, `lib/api.js` deleted; `page.tsx` redirects |
| `build:all` 0 | NOT_CHECKED as a whole |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run exists for this branch |

Note: `test:inlined-env` overwrites each app's build output and takes several minutes; no CI job runs it yet (proposed for T1). Evidence: VERIFIED_HEAD_ONLY.
