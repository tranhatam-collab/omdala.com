# VERIFY T3 head 74d1f74 (claude/omdala-t3-web)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok (lockfile and package.json unchanged versus `da7bf52`); Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Delta over verified `da7bf52`: WO-T3-17 (clear EN/VI chat messages for the AI cap and inactive subscription) and BL-T3-06 (brand-marketplace SEO and accessibility).

| Claim (T3 reports) | Result |
|---|---|
| `pnpm typecheck`, `pnpm lint`, `pnpm brand:lint` | VERIFIED: 0, 0, 0 |
| `pnpm test:release-governance` 394 pass (after T3 restored code a T1 contract script greps) | VERIFIED: 394 pass / 0 fail |
| `pnpm test:app` 41 pass | VERIFIED: 41 passed |
| brand-marketplace unit tests 4 pass | VERIFIED: 4 passed |
| `pnpm e2e:brand-exchange` 39 pass (15 + 24 new) | VERIFIED: 39 passed |
| `pnpm e2e:app` 43 pass, 1 skipped | VERIFIED: 43 passed, 1 skipped, 0 failed |
| Unchanged: `e2e:web`, `e2e:docs`, `e2e:auth`, `e2e:admin` | VERIFIED: 31, 48, 27, 25 passed |
| Brand export: `<html lang>` per locale, canonical, hreflang EN/VI/x-default only, inquiry pages noindex, sitemap with both locales, single robots source | VERIFIED independently: built `@omdala/brand-marketplace` and scanned all 52 HTML files: 0 problems (no wrong `lang`, no zh/es/ja/ko hreflang, canonical present on content pages, inquiry pages noindex); `sitemap.xml` has 43 `<loc>` entries and no zh/es/ja/ko URL; `robots.txt` is `Disallow: /` for this non-production build and the repo has one robots source |
| `build:all` 0 | NOT_CHECKED as a whole (brand build ran, exit 0) |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run exists for this branch |

Finding for T2 (from T3's report, plausible and cheap to check): the API's CORS `exposeHeaders` only lists `x-request-id`, so a cross-origin browser cannot read `Retry-After`; the UI then shows a computed reset time. Not re-checked by T4. Evidence: VERIFIED_HEAD_ONLY.
