# VERIFY T3 head 8b37c13 (claude/omdala-t3-web)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok (lockfile unchanged versus `74d1f74`); Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Delta over verified `74d1f74`: WO-T3-18 (security headers for every app) and BL-T3-07 (first-load JS budgets).

| Claim (T3 reports) | Result |
|---|---|
| `pnpm test:security-headers` 11 pass | VERIFIED: 11 tests, 11 pass, 0 fail |
| `pnpm test:bundle-budget` 10 pass (verify run) | VERIFIED: 10 tests, 10 pass, 0 fail |
| `pnpm test:release-governance` 394 pass | VERIFIED: 394 pass / 0 fail |
| `pnpm typecheck`, `pnpm lint`, `pnpm brand:lint` | VERIFIED: 0, 0, 0 |
| `pnpm e2e:docs` 49, `e2e:admin` 26, `e2e:auth` 28, `e2e:brand-exchange` 39, `e2e:web` 31, `e2e:app` 43 + 1 skipped | VERIFIED: 49, 26, 28, 39, 31, 43 passed; app 1 skipped; 0 failed |
| `test:app` 41 | VERIFIED: 41 passed |
| Headers: one CSP per surface, HSTS, nosniff, matching frame options, no third-party origin | VERIFIED by reading each `apps/*/public/_headers`: one CSP line each; every app has HSTS; web and docs `frame-ancestors 'self'` with SAMEORIGIN; app, admin, auth, brand `'none'` with DENY; the only external origin anywhere is `https://api.omdala.com` (staging rewrite is covered by the existing `scripts/surface-release-contract.test.mjs`, which passes); app keeps `'unsafe-eval'` (below), the others only `'unsafe-inline'` |
| FINDING (T0 decision): the app's code editor cannot load under the shipped CSP | CONFIRMED by reading: `apps/app` depends on `@monaco-editor/react` (`package.json`), no `loader.config` or local Monaco path exists in `apps/app/app` (so the library's default jsDelivr loader applies), and the app CSP names no host other than `'self'` and `https://api.omdala.com`. WO-T4-16 (after WO-T3-19, the self-hosting fix) will test it in a browser |
| `build:all` 0 | NOT_CHECKED as a whole (all six apps were built by the budget and header tests) |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run exists for this branch |

Evidence: VERIFIED_HEAD_ONLY.
