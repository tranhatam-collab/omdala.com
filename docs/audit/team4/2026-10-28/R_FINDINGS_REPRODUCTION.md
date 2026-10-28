# R-01..R-28 reproduction on the candidate base

- Order: WO-T4-02 (parent P0-03)
- Candidate base: `7abd96251619c20f5e3b94755b307ba191e8bc60` (`OMCODE/infra-e2e-auto-20261026`). Evidence: VERIFIED_HEAD_ONLY (T4 read the tree and ran the commands below at this SHA); no hosted CI read.
- Source of the findings: section 6 of `git show c3108c944bafd4e53415a8e49e8df508a7db0597:docs/06-strategy/DEV_LEDGER.md` (immutable; found on an older branch). The "location" column is that older location; "now" gives where the same concern lives at the base.
- Owners come from plan section 7 (path ownership). Where a path falls outside every carve-out, that is noted.
- Public repo: unfixed-vulnerability entries are neutral (file, category, severity). The two reproduction commands that execute code use a placeholder host and print only the function output.
- Verdicts: CONFIRMED (concern still present), NOT_REPRODUCED (what makes it safe), MOOT (code no longer exists).

## Summary

CONFIRMED 14, NOT_REPRODUCED 9, MOOT 5 (total 28). Confirmed High severity: R-01 (admin gate), R-03 (database TLS verification), R-04 (redirect validation). R-05 is not reproduced.

| R | Sev (old) | Verdict | Team | Evidence (base 7abd962) |
|---|---|---|---|---|
| R-01 | High | CONFIRMED | T3 | `apps/admin/app/layout.tsx:35-36`: `getMockAdminSession()` then `hasRequiredRole(session, ['admin','system'])`; the mock (`services/auth/src/index.ts:51-52`) always carries role `admin`, so `canAccessAdmin` is always true. |
| R-02 | High | NOT_REPRODUCED | T3 | `apps/app/lib/session-client.ts` no longer exists. Gate uses `hasValidServerSession()` (`apps/app/lib/api-client.ts:80-93`), which calls `/v1/auth/session` and checks `expiresAt`; no localStorage session JSON is trusted. |
| R-03 | High | CONFIRMED | T2 | `services/api/src/db/client.ts:40`: `ssl: { rejectUnauthorized: false }` for every connection. |
| R-04 | High | CONFIRMED | T2 | `services/api/src/stub.ts:22-28`: `normalizePath` accepts any string starting with `/`, including protocol-relative paths; used for the magic-link `redirectTo` (`stub.ts:53`) and `next` (`services/api/src/index.ts:2913`). |
| R-05 | High | NOT_REPRODUCED | T2 (code), T1 (wrangler) | `wrangler.toml:7-9` binds only the `api.omdala.com` custom domain (no `/v2/reality/*` route list). `services/api/src/index.ts:2260-2288`: in staging/production the middleware requires persistence (503), an authenticated session, and a released GET route (501 otherwise). Tests: `index.v2.test.ts` "requires a valid session before production reality data is read", `index.v2.db-errors.test.ts` "blocks unreleased reality routes in staging and production" (both pass in `pnpm test:api`). Non-staging/production environments remain open by design. |
| R-06 | Med | NOT_REPRODUCED | T1 | `.github/workflows/build.yml` does not exist. `.github/workflows/ci.yml` job `test-api` runs `pnpm --filter @omdala/api test` and `run check`. (Caveat: ci.yml does not run for `claude/omdala-*` branches yet.) |
| R-07 | Med | CONFIRMED | T3 | Two sources: `apps/admin/app/robots.ts` and `apps/admin/public/robots.txt` (both `Disallow: /`, content consistent). |
| R-08 | Med | CONFIRMED | T3 | `apps/app/app/(dashboard)/nodes/new/page.tsx:63`: `<button type="button" ...>Save draft</button>` with no handler. |
| R-09 | Med | CONFIRMED | T3 | `apps/app/app/(dashboard)/requests/new/page.tsx:63`: same inert button. |
| R-10 | Med | CONFIRMED | T3 | `apps/app/app/robots.ts` and `apps/app/public/robots.txt` both exist (content consistent). |
| R-11 | Med | NOT_REPRODUCED | T3 | File renamed `apps/app/e2e/auth-dashboard.spec.ts`; the 401 tests (`:193`, `:207`, `:217`) assert `toHaveURL(/auth\.omdala\.com\/login/)` and the `next` param, i.e. the redirect is required. Caveat: they FAILED in the T4 sandbox for network reasons (see E2E_MATRIX.md section 3). |
| R-12 | Med | CONFIRMED | T3 | `apps/docs/app/page.tsx:1-10`: `'use client'` and `useLocationSearchParam('lang')`; docs has no `[lang]` route tree, so exported HTML is the default language. |
| R-13 | Med | CONFIRMED | T3 | `apps/docs/app/robots.ts` returns `disallow: /` when the build is not indexable, while `apps/docs/public/robots.txt` says `Allow: /` plus a sitemap. Contents disagree. Which file wins in the exported build: NOT_CHECKED. |
| R-14 | Med | NOT_REPRODUCED | T3 | Every web page (`apps/web/app/*/page.tsx`, `[lang]/**/page.tsx`) exports `metadata` through `buildLocalizedMetadata` (`apps/web/app/lib/localized-metadata.ts`), which sets a per-path canonical (`packages/seo/src/metadata.ts:42`). Leftover: 10 dead `head.tsx` files that Next 15 ignores (cleanup). |
| R-15 | Med | NOT_REPRODUCED | T3 | `apps/web/app/layout.tsx:8-10` computes `allowIndexing` from release environment and `OMDALA_NOINDEX !== "true"`; `robots.index` uses it (`:43-44`). |
| R-16 | Med | NOT_REPRODUCED | T3 | `apps/web/app/lib/useWebLocale.ts` still reads `lang` client-side but has no importer (`grep -rn useWebLocale apps/web` returns only its own file); web uses server-rendered `[lang]` routes. Dead file, cleanup only. |
| R-17 | Med | NOT_REPRODUCED | T3 | `apps/web/public/robots.txt` does not exist; only `apps/web/app/robots.ts`. |
| R-18 | Med | MOOT | T2 (migrations path), see note | `infra/migrations/0001_reality_core.up.sql` no longer exists; no tracked `.sql` contains a `\i` include. Migrations now live in `infra/postgres/migrations/000{1,2,3}_*.sql`. Note: that path is not in T2's `infra/{db,migrations,d1}` carve-out, so by section 7 literal reading it belongs to T1; T0 should clarify. |
| R-19 | Med | CONFIRMED | T2 | `packages/core/src/i18n.ts:2`: `OMDALA_READY_LANGUAGES` lists all six languages, while web and brand serve only EN/VI (`apps/web/app/lib/locale-routing.ts`). Content parity of zh/es/ja/ko elsewhere: NOT_CHECKED. |
| R-20 | Med | NOT_REPRODUCED | T3 | `packages/seo/src/utils.ts:15-45`: `buildLanguageAlternates` iterates the caller's `options.locales`, so `vi` is added only when requested. |
| R-21 | Med | CONFIRMED | T3 | The shared `packages/ui` switcher is gone; per-app switchers in `apps/{app,admin,docs}/app/components/LanguageSwitcher.tsx` build links from `pathname` only (`const currentPath = pathname`), so every non-`lang` query parameter is dropped. Impact on the login page is reduced: `apps/auth` has no switcher. |
| R-22 | Med | MOOT | T1 | `scripts/backup/omdala_pg_restore.sh` no longer exists. Successors (not part of this finding): `infra/backup/restore-db.sh:43` sets `ON_ERROR_STOP=on`; `infra/scripts/restore-test.sh:4` uses `set -euo pipefail`. |
| R-23 | Med | MOOT | T1 | `scripts/cleanup_test_data.sql` no longer exists. |
| R-24 | Med | MOOT | T1 | `scripts/ops_v2_report_upload.sh` no longer exists. |
| R-25 | Med | MOOT | T1 | `scripts/smoke_v2_reality.sh` no longer exists. |
| R-26 | Med | CONFIRMED | T2 | `services/api/src/db/reality-repository.test.ts:23-60`: the test defines its own `normalizeExplanation` and asserts on it; the real function (`reality-repository.ts:33`) is not exported or called by those cases. |
| R-27 | Med | CONFIRMED (human gate H3 / INFRA-003) | T1 + Founder | `services/api/wrangler.toml:4` pins account `f3f9e762…ba192`; `docs/CLOUDFLARE_ACCOUNT_BASELINE_OMDALA.md:25` names `93112cc8…ba3`. Divergence unchanged; needs the human decision, not a code fix. |
| R-28 | Med | CONFIRMED | T3 | `apps/docs/app/api/page.tsx:12-13` says `/v1` groups routes by identity, resources, offers, requests, matches, conversations, bookings, payments, proofs, trust and admin actions. `services/api/src/index.ts` registers `/v1` groups account, ai, analytics, auth, billing, contact, notifications, security, workspaces only (the grep for bookings/conversations/matches/offers returns 0). |

## Reproduction commands (run from the repo root at 7abd962)

```
R-01  grep -n "getMockAdminSession\|hasRequiredRole" apps/admin/app/layout.tsx; sed -n 51,53p services/auth/src/index.ts
R-02  ls apps/app/lib/session-client.ts; sed -n 80,93p apps/app/lib/api-client.ts
R-03  grep -rn "rejectUnauthorized" services/api/src
R-04  node --experimental-strip-types --no-warnings --input-type=module -e "const {createApiContractStub}=await import('./services/api/src/stub.ts'); const s=createApiContractStub({allowedOrigins:[]}); console.log(s.normalizePath('//example.invalid','/dashboard'))"
      (observed output: //example.invalid, i.e. not replaced by the fallback; an absolute https URL is replaced by the fallback)
R-05  sed -n 2260,2288p services/api/src/index.ts; pnpm test:api   (133 pass at this SHA)
R-06  ls .github/workflows/build.yml; grep -n "api" .github/workflows/ci.yml
R-07/10/13/17  git ls-files 'apps/*/app/robots.ts' 'apps/*/public/robots.txt'
R-08/09  grep -n -B1 "Save draft" "apps/app/app/(dashboard)/nodes/new/page.tsx" "apps/app/app/(dashboard)/requests/new/page.tsx"
R-11  sed -n 193,205p apps/app/e2e/auth-dashboard.spec.ts
R-12  sed -n 1,10p apps/docs/app/page.tsx
R-14  for f in apps/web/app/*/page.tsx 'apps/web/app/[lang]'/*/page.tsx; do grep -c "export const metadata" "$f"; done; git ls-files apps/web | grep -c head.tsx
R-15  sed -n 8,10p apps/web/app/layout.tsx
R-16  grep -rn useWebLocale apps/web --include=*.ts --include=*.tsx
R-18  git ls-files | grep -E "\.sql$" | xargs grep -nE '^\\i[ r]'   (no output)
R-19  sed -n 1,3p packages/core/src/i18n.ts
R-20  sed -n 15,45p packages/seo/src/utils.ts
R-21  grep -n "currentPath" apps/{app,admin,docs}/app/components/LanguageSwitcher.tsx
R-22..25  git ls-files | grep -E "omdala_pg_restore|cleanup_test_data|ops_v2_report|smoke_v2_reality"   (no output)
R-26  sed -n 20,65p services/api/src/db/reality-repository.test.ts; grep -n normalizeExplanation services/api/src/db/reality-repository.ts
R-27  grep -n account_id services/api/wrangler.toml; sed -n 24,26p docs/CLOUDFLARE_ACCOUNT_BASELINE_OMDALA.md
R-28  sed -n 8,15p apps/docs/app/api/page.tsx; grep -nE 'app\.(get|post|put|patch|delete)\("/v1/' services/api/src/index.ts
```

## Notes for the coordinator

1. Priority for fixing, by severity and exposure: R-01 (admin treats every visitor as admin; matrix finding 3 says there is also no admin test), R-03, R-04, then R-27 (needs Founder). R-04 and R-03 live in T2's `services/api/src/**`.
2. No test was written or changed. The suggested regression tests are: an admin-gate negative spec (T3, with WO-T3-02), a redirect-normalizer unit test and a DB TLS config test (T2, WO-T2-02 adjacent).
3. Cleanup candidates with no behaviour change: 10 dead `head.tsx` files and `useWebLocale.ts` in `apps/web/app` (T3).
4. Ownership gap: `infra/postgres/**` is covered by T1's `infra/**` wildcard, not by T2's `infra/{db,migrations,d1}`.
