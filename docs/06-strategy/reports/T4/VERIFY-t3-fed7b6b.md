# VERIFY T3 head fed7b6b (claude/omdala-t3-web)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok; Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Delta over verified `5190ac8`: WO-T3-14 (bilingual noindex 404 for web) and a report correction.

| Claim (WO-T3-14 report) | Result |
|---|---|
| `pnpm typecheck`, `pnpm lint`, `pnpm brand:lint` | VERIFIED: 0, 0, 0 |
| `pnpm e2e:web` 17 pass | VERIFIED: 17 passed |
| Unchanged: `e2e:docs`, `e2e:auth`, `e2e:app`, `e2e:admin`, `test:app` | VERIFIED: 40; 24; 35 passed + 1 skipped (integrated journey, needs a local API); 25; 35 |
| Web 404 shows English and Vietnamese, stays noindex | VERIFIED from the built export: `apps/web/out/404.html` has `<html lang="en">`, sections `lang="en"` and `lang="vi"`, and robots `noindex, nofollow` |
| `build:all` 0 | NOT_CHECKED as a whole; `@omdala/docs` and `@omdala/web` builds exit 0 (used below) |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run exists for this branch |

Re-run of WO-T4-08 (SEO check) on the built exports from this head, using the same parser as before:
- docs: 8 content pages, 0 violations (1 canonical, hreflang en/vi/x-default only, `<html lang>` matches path); sitemap 8 `<loc>` entries with 4 under `/vi`; 404 has `lang="en"` and noindex.
- web: 20 content pages (10 EN + 10 `/vi/*`), 0 violations (every `/vi/*` page now `lang="vi"`); sitemap 20 `<loc>` entries (VI pages listed separately); 0 zh/es/ja/ko URLs anywhere.
So all three WO-T4-08 findings (web `/vi` html lang, web sitemap, docs 404 lang) are FIXED at this head.

Evidence: VERIFIED_HEAD_ONLY.
