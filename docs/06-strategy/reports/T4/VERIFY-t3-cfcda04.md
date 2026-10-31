# VERIFY T3 head cfcda04 (claude/omdala-t3-web)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok (lockfile unchanged); Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Delta over verified `3c3f683`: BL-T3-02 (self-hosted Inter and Sora, font specs).

| Claim (BL-T3-02 report) | Result |
|---|---|
| `pnpm typecheck`, `pnpm lint`, `pnpm brand:lint` exit 0 | VERIFIED: 0, 0, 0 |
| `pnpm e2e:auth` 24 pass | VERIFIED: 24 passed |
| `pnpm e2e:docs` 39 pass | VERIFIED: 39 passed |
| `pnpm e2e:web` 7 pass | VERIFIED: 7 passed |
| `pnpm e2e:app` 24 pass | VERIFIED: 24 passed, 0 failed, 0 skipped, no network |
| Unchanged: `e2e:admin` (admin left on system fonts), `test:app` | VERIFIED: 25 passed; 33 passed |
| Font files are the unmodified @fontsource 5.3.0 woff2 files, registry integrity as recorded in `packages/ui/assets/fonts/FONTS.md` | VERIFIED independently: `npm pack @fontsource/inter@5.3.0 @fontsource/sora@5.3.0` returned the same two sha512 integrity strings as FONTS.md, and all 12 shipped woff2 files are byte-identical (`cmp`) to the upstream `files/` copies |
| OFL license files shipped for both families | VERIFIED present (`inter/OFL.txt`, `sora/OFL.txt`) |
| No Google Fonts reference left in source | VERIFIED: no `googleapis`/`gstatic` string in `apps/*/app` or `packages/ui/src`; the four font specs assert no such requests at runtime and pass |
| `build:all` 0 (T3 report) | NOT_CHECKED |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run exists for this branch (ci.yml lease not applied; GitHub tools were also unavailable this cycle) |

Open from earlier reports: web `/vi/*` pages still ship `<html lang="en">` (T3's BL-T3-05, not yet landed). Evidence: VERIFIED_HEAD_ONLY.
