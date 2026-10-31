# VERIFY T3 head 5190ac8 (claude/omdala-t3-web)

- Order: WO-T4-03. Exact SHA in a separate worktree, frozen-lockfile install ok; Playwright with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`. Delta over verified `02d5453`: WO-T3-11 (per-locale root layouts), WO-T3-12 (NEXT_PUBLIC env fix, sign-out, integrated journey spec), WO-T3-13 (app language switcher).

| Claim (T3 reports) | Result |
|---|---|
| `pnpm typecheck`, `pnpm lint`, `pnpm brand:lint` exit 0 | VERIFIED: 0, 0, 0 |
| `pnpm test:app` 35 pass | VERIFIED: 4 files, 35 passed |
| `pnpm e2e:web` 17 pass | VERIFIED: 17 passed |
| `pnpm e2e:docs` 40 pass | VERIFIED: 40 passed |
| `pnpm e2e:auth` 24 pass | VERIFIED: 24 passed |
| `pnpm e2e:app` 35 pass, 1 skipped (integrated journey needs a local API) | VERIFIED: 35 passed, 1 skipped, 0 failed |
| `pnpm e2e:admin` | VERIFIED: 25 passed |
| WO-T3-11: `/vi/*` ships `<html lang="vi">` (closes WO-T4-08 web finding) | VERIFIED in the last cycle's specs (`locale-html.spec.ts` passes); built-HTML re-scan is part of the next SEO pass, see WO-T4-08 update if added |
| **High finding (WO-T3-12): staging app builds used the PRODUCTION API origin** because `process?.env?.NEXT_PUBLIC_*` is not inlined | VERIFIED independently. Built `apps/app` at `02d5453` and at `5190ac8` with the staging `NEXT_PUBLIC_*` values the deploy workflow sets (API, AUTH_API_BASE, OMDALA_API_BASE_URL, WEB/APP/AUTH/BRAND origins, RELEASE_ENVIRONMENT=staging). At `02d5453` the chunks keep three un-inlined lookups `…default?.env?.NEXT_PUBLIC_API_URL` feeding `resolvePublicOrigin("api", undefined, undefined)`, which `packages/core/src/public-origins.mjs:116-120` resolves to the production origin. At `5190ac8` the call sites are `resolvePublicOrigin("api","https://api-staging.omdala.com","staging")` and no un-inlined lookup remains. No `process?.env?.NEXT_PUBLIC` use is left in `apps/` or `packages/` |
| Integrated journey (`integrated-journey.spec.ts`) against the local stack | NOT_CHECKED by T4 (skipped in normal runs; T3 ran it once by hand) |
| `build:all` 0 | NOT_CHECKED as a whole (the app export build ran, exit 0, as part of the origin check) |
| Hosted CI for the exact SHA | NOT_CHECKED: no workflow run exists for this branch |

Follow-ups for T1: re-check the staging deploy artifacts and the staging go-live for the origin issue (T3 asked the same); any staging app build made before this fix talked to the production API. Evidence: VERIFIED_HEAD_ONLY.
