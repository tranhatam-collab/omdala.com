# VERIFY T3 head e967a33 (claude/omdala-t3-web)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok (lockfile and package.json unchanged); Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Delta over verified `fed7b6b`: WO-T3-15 (dependency-free accessibility specs, heading-level fixes).

| Claim (WO-T3-15 report) | Result |
|---|---|
| `pnpm typecheck`, `pnpm lint`, `pnpm brand:lint` | VERIFIED: 0, 0, 0 |
| `pnpm e2e:web` 31 pass | VERIFIED: 31 passed |
| `pnpm e2e:docs` 48 pass | VERIFIED: 48 passed |
| `pnpm e2e:app` 37 pass, 1 skipped (local-stack journey) | VERIFIED: 37 passed, 1 skipped, 0 failed |
| `pnpm e2e:auth` 27 pass | VERIFIED: 27 passed |
| Unchanged: `e2e:admin`, `test:app` | VERIFIED: 25 passed; 35 passed |
| Heading-level fixes on 7 web page views (h3 straight after h1 now h2) | VERIFIED independently: built `@omdala/web` and scanned every `apps/web/out/**/index.html` (21 pages incl. 404, script blocks stripped): exactly one h1 on each and no skipped heading level, 0 problems |
| No new dependency | VERIFIED: `pnpm-lock.yaml` and `package.json` unchanged versus `fed7b6b` |
| `build:all` 0 | NOT_CHECKED as a whole (web export build exit 0) |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run exists for this branch |

Limits (stated by T3, accepted): rule-based checks only, not contrast, screen-reader or full WCAG coverage. Evidence: VERIFIED_HEAD_ONLY.
