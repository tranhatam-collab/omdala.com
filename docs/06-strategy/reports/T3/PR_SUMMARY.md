# T3 (Web, Product UI, Docs): PR summary

Draft PR #18, base `OMCODE/infra-e2e-auto-20261026`. All work is under `apps/{web,app,admin,docs,auth,brand-marketplace}`, `packages/{ui,seo}`, `docs/06-strategy/reports/T3`, plus two lease edits (root `package.json` scripts; one `pnpm-lock.yaml` entry for `monaco-editor`).

## What changed, by order (SHA)
- **Auth, docs, admin e2e** (dd12483, a7466fd, 2f24d80): Playwright suites for the static exports; the magic-link token is removed from the URL; docs get sitemap, canonical and hreflang; admin denies access by default (the mock session needs a build-time preview flag).
- **WO-T3-04/05/06** (621b3a0, 63a258a, 6256448): one robots source per app; language switchers keep query and hash; dead "Save draft" buttons disabled; docs list only implemented API groups; docs render EN at `/` and VI under `/vi`.
- **BL-T3-01** (054ec10): `buildLanguageAlternates` defaults to EN+VI.
- **WO-T3-07..10** (3c3f683): hermetic redirect specs (pass offline), 503/504 handling in consumers, staging-policy fix, VI go-live check.
- **BL-T3-02, BL-T3-04** (cfcda04, 02d5453): self-hosted Inter and Sora with a no-Google-Fonts assertion; contact and access-request forms with UI e2e on a local API stub.
- **WO-T3-11, 13, 14** (e9a29cd, 1821553, 8c1e3b9): per-locale root layouts so `/vi` ships `lang=vi`, locale sitemap, docs 404; app language switcher styling; bilingual noindex 404.
- **WO-T3-12** (5190ac8): auth-to-app journey on a real local API. Fixed: app and auth bundles read `NEXT_PUBLIC_*` in a form that is not inlined, so staging builds used the production API origin. Sign-out added to the app.
- **WO-T3-15, 16** (e967a33, da7bf52): dependency-free accessibility specs and heading-level fixes; legacy sign-in skeleton removed; sentinel-build test for env inlining.
- **WO-T3-17, BL-T3-06** (c706e7e, 74d1f74): EN/VI messages for the AI daily cap and inactive subscription; brand-marketplace locale parity (lang, canonical/hreflang, sitemap, robots).
- **WO-T3-18, BL-T3-07** (5f4103c, 8b37c13): consistent security headers on every app with a policy test; first-load JS budgets with recorded baselines.
- **WO-T3-19, 20** (299af7a, 3c166ec, 6def072): Monaco self-hosted (export and `next dev`); `'unsafe-eval'` and the CDN dropped from the app CSP; a spec that opens the editor under the shipped CSP.

## Tests (own runs at 6def072, worktree only)
`e2e:app` 44 pass / 1 skip / 0 fail; `e2e:app-export` 2/0; `test:security-headers` 12/0; `test:bundle-budget` 10/0; `test:inlined-env` 11/0; `test:release-governance` 394/0; typecheck, lint, brand:lint and `build:all` pass. Per-order counts for web, docs, auth, admin and brand are in each report. The one skipped spec is the opt-in local-stack journey.

## Open findings
- Hosted CI does not run for this branch yet; every result here is a local run, not a CI result.
- The local API CORS config does not expose `Retry-After`, so the UI shows the next UTC midnight for the AI cap (needs a T2 change).
- The app CSP keeps `blob:` workers and `data:` fonts, required by the editor.
- The release-control contract test matches source text, so refactors of the gated files can break it.

## Waits for the owner or T1
Hosted CI for this branch (T1); token in URL fragment instead of query (owner UX/security decision); admin edge access layer before any live data (T1 design, owner).
