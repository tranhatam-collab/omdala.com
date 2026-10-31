# R-01..R-28 refresh at the newest heads (WO-T4-10)

Heads merged in a scratch tree on base 7abd962 (conflict-free, never pushed): T2 `7c79659`, T3 `74a89b4`, TAI `c1c5366`. Evidence: VERIFIED_WORKTREE_ONLY for the rows marked "ran" or "read"; hosted CI NOT_CHECKED for the merged tree. Previous table: `docs/audit/team4/2026-10-28/R_FINDINGS_REPRODUCTION.md` (14 CONFIRMED, 9 NOT_REPRODUCED, 5 MOOT at 7abd962). Neutral wording: file and category only.

## Changes since 7abd962
| R | Was | Now | Evidence |
|---|---|---|---|
| R-01 admin gate | CONFIRMED High | **FIXED** | `apps/admin/app/layout.tsx:38-40`: session is the mock only when `OMDALA_ADMIN_PREVIEW === '1'`, otherwise null and access is denied; `apps/admin/e2e/admin.spec.ts` covers default-deny and preview modes (WO-T4-03 runs: admin 26/26 on the merged tree) |
| R-03 DB TLS | CONFIRMED High | **FIXED** | `services/api/src/db/client.ts:31-37`: verification on; the insecure flag works only in local/test environments and throws `DB_TLS_INSECURE_REFUSED` elsewhere |
| R-04 redirect validation | CONFIRMED High | **FIXED** | ran `normalizePath`: `//host`, `/\host`, `https://host`, `/%2f%2fhost` all return the fallback `/dashboard`; `/ok?next=1` kept |
| R-07, R-10 duplicate robots | CONFIRMED | **FIXED** | `git ls-files`: admin and app have only `app/robots.ts` |
| R-13 docs robots conflict | CONFIRMED | **FIXED** | `apps/docs/public/robots.txt` gone; `apps/docs/app/robots.ts` decides via `isIndexableBuild` |
| R-08, R-09 inert Save draft | CONFIRMED | **CHANGED (not a defect)** | button is `disabled`, `aria-disabled`, labelled "Save draft (not available yet)" (`nodes/new/page.tsx:66-74`, `requests/new/page.tsx:63-71`); the feature itself is still absent |
| R-12 docs language | CONFIRMED | **FIXED** | docs now has `(en)` and `vi` route trees (`apps/docs/app/(en)/*`, `apps/docs/app/vi/*`) and no client-side `lang` page |
| R-21 language switcher | CONFIRMED | **IMPROVED, not re-run in a browser** | app and admin build the link from `pathname` plus the current location suffix (`LanguageSwitcher.tsx:32`); docs switcher has no `currentPath` helper |
| R-26 test of a local copy | CONFIRMED | **FIXED** | `normalizeExplanation` exported (`reality-repository.ts:34`) and imported by the test (`reality-repository.test.ts:18`) |
| R-28 docs API page text | CONFIRMED | **CHANGED, NOT_CHECKED line by line** | the old route-group sentence is no longer in `apps/docs/app/(en)/api/page.tsx`; the API has 36 `/v1` routes in `index.ts` |

## Unchanged
- Still CONFIRMED: **R-19** (`packages/core/src/i18n.ts:2` `OMDALA_READY_LANGUAGES` = en, vi: now consistent with web/brand serving two languages, so downgrade to NOT_REPRODUCED for the original claim; zh/es/ja/ko content still absent, an owner decision); **R-27** (`services/api/wrangler.toml:4` account `f3f9e762…ba192` versus `docs/CLOUDFLARE_ACCOUNT_BASELINE_OMDALA.md:26` `93112cc8…ba3`; founder/T1 gate H3).
- NOT_REPRODUCED rows R-02, R-05, R-06, R-11, R-14..R-17, R-20: not re-run; no change expected, no listed file changed in a way that reopens them except R-11 (specs are now hermetic, WO-T3-07, verified 23/23).
- MOOT rows R-18, R-22..R-25: files remain absent.

## Result
CONFIRMED 14 -> 2 open (R-27 founder gate; R-19 reclassified as owner decision). Fixed: R-01, R-03, R-04, R-07, R-10, R-12, R-13, R-26; changed: R-08, R-09, R-21, R-28. The three High findings (R-01, R-03, R-04) are closed.

## E2E matrix delta (E2E-1 / E2E-2 exits)
Compared with `2026-10-30_E2E_MATRIX_REFRESH.md`: matrix gap 1 (real-PostgreSQL suites not in CI) is **closed**: hosted run 41182035820 ran the database-gated API suites with zero skipped (WO-T2-30, VERIFIED_CURRENT). Gap 2 (untrusted cert in the integration test) closed by the same job. Gap 4 (app 401 redirect specs hit the real auth host) closed (WO-T3-07). Gap 10 (desktop `/bin/zsh`) closed at T3 `74a89b4` (desktop 117/117). Gap 5 (T3 has no hosted CI) still open. Gaps 3 (browser journey against a real local API), 7, 8, 11, 12 still open; no order covers them yet. E2E-1 (local, mocked) is met for api, web, app, auth, docs, admin, brand and Om AI; E2E-2 (local integrated with a real API worker in a browser) is not met.
