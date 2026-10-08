# OMDALA Bilingual 3-Team Sync Execution

Effective date: April 22, 2026
Status: Active
Scope: `omdala.com` only
Exclusion: no planning, copy, routing, SEO, or release dependency on any non-OMDALA platform

Use this file together with:

- `docs/OMDALA_UNIVERSAL_BILINGUAL_LANGUAGE_REBUILD_COMMAND_2026-04-21.md`
- `docs/OMDALA_BILINGUAL_LANGUAGE_CODEX_2026-04-21.md`
- `docs/OMDALA_BILINGUAL_LANGUAGE_AUDIT_2026-04-21.md`
- `docs/OMDALA_EXECUTION_BOARD_SPRINTS_2026-04-19.md`
- `docs/OMDALA_3_TEAM_PROGRESS_TRACKER_2026-04-19.md`
- `docs/OMDALA_TEAM_2_BILINGUAL_FILE_MODULE_EXECUTION_2026-04-23.md`
- `docs/OMDALA_TEAM_3_BILINGUAL_GATE_EXECUTION_2026-04-23.md`
- `docs/TEAM_1_BILINGUAL_PUBLIC_WEB_EVIDENCE_2026-04-23.md`
- `docs/TEAM_1_ADMIN_2_HEARTBEAT_REPORT_2026-04-23.md`

## 1. Current state at sync time

### Already completed

- bilingual source is established in `content/en.json` and `content/vi.json`
- shared chrome, page metadata, and not-found copy read from controlled source
- public `apps/web` route bodies are migrated for `en` and `vi` across:
  - `/`
  - `/what-is-omdala`
  - `/how-it-works`
  - `/for-experts`
  - `/for-hosts`
  - `/for-communities`
  - `/trust`
  - `/vision`
  - `/faq`
  - `/contact`
- stale duplicate route metadata files were removed from `apps/web/app`
- repo planning lane has no remaining external-platform naming leakage in the checked OMDALA docs/web scope
- Team 1 public web evidence is published for metadata parity, CTA/menu/footer inventory, and image alt inventory
- public web language generation, language switcher, sitemap alternates, and metadata alternates are locked to `en` and `vi`

### Still open

- `apps/web/app/layout.tsx` still owns a server-rendered root `<html lang="en">`, but runtime document language sync now receives the active page language
- image alt-text inventory exists in Team 1 evidence and still needs Team 3 rendered crawl confirmation
- `apps/app`, `apps/auth`, `apps/admin`, and `packages/ui` still need user-facing text inventory and centralization; Team 2 now has a file-module execution dispatch
- no full publish gate exists yet for missing `vi` or `en` content; Team 3 now has the first source-integrity check in `scripts/bilingual-source-check.mjs`
- final 4-pass evidence is still open: AI, editor, SEO, QA

## 2. Non-negotiable rules for every team

1. Vietnamese is the source language for meaning lock. English must match intent, not word order.
2. No new public-facing text may be hard-coded into route files, components, or scripts when a controlled source can own it.
3. Any copy touching `apps/web` must preserve language-specific SEO output and language-correct internal links.
4. Team ownership is strict. Cross-team edits require a declared handoff note in the daily sync block.
5. No OMDALA task may reintroduce non-OMDALA platform naming, tourism framing, or mixed-brand assumptions.

## 3. Ownership boundary

| Team | Primary ownership | File/module scope | What they must deliver |
| --- | --- | --- | --- |
| Team 1 | Public web, content, SEO language quality | `apps/web`, `content/en.json`, `content/vi.json`, `packages/seo` when metadata wording changes | production-ready public copy, metadata, internal-link language coherence, alt-text closure on public web |
| Team 2 | Product surfaces and shared UI text | `apps/app`, `apps/auth`, `apps/admin`, `packages/ui` | user-facing text inventory, source centralization, locale-safe UI text, route and state copy consistency |
| Team 3 | Validation, release gate, reporting, QA evidence | `scripts`, release docs, cross-team verification artifacts | crawl/audit scripts, publish gate, release report, final bilingual go/no-go package |

## 4. Team status now

| Team | Status now | Current truth |
| --- | --- | --- |
| Team 1 | `in_progress`, ahead of other teams | public web `en` and `vi` body migration is complete; source evidence is published; Team 3 rendered crawl confirmation remains |
| Team 2 | `ready_for_execution` on the bilingual lane | file-module execution dispatch is published; product surfaces still need inventory, controlled sources, and route-safe UI wording cleanup |
| Team 3 | `in_progress` on the bilingual gate | initial source-integrity script exists and passes; crawl, hard-code scan, publish block, and founder report still need to be built |

## 5. Sprint board

### Sprint 1 - Authority lock and inventory

| Task ID | Team | Owner role | File/module targets | Dependencies | Output | Definition of done | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `BL-S1-T1-01` | Team 1 | Web lead | `apps/web/app/HomePageView.tsx`, `apps/web/app/what-is-omdala/WhatIsOmdalaPageView.tsx`, `apps/web/app/how-it-works/HowItWorksPageView.tsx`, `apps/web/app/for-experts/ForExpertsPageView.tsx`, `apps/web/app/for-hosts/ForHostsPageView.tsx`, `apps/web/app/for-communities/ForCommunitiesPageView.tsx`, `apps/web/app/trust/TrustPageView.tsx`, `apps/web/app/vision/VisionPageView.tsx`, `apps/web/app/faq/FaqPageView.tsx`, `apps/web/app/contact/ContactPageView.tsx`, `content/en.json`, `content/vi.json` | none | public-route source lock | every main public body route reads `en` and `vi` from controlled source | `done` |
| `BL-S1-T1-02` | Team 1 | SEO/content lead | `apps/web/app/lib/localized-metadata.ts`, `apps/web/app/**/head.tsx`, `content/en.json`, `content/vi.json` | `BL-S1-T1-01` | metadata parity sheet | all public route titles and descriptions are aligned with source content | `done_pending_team3_crawl` |
| `BL-S1-T1-03` | Team 1 | QA/content lead | `apps/web/public`, rendered public image usage, docs evidence file | `BL-S1-T1-01` | alt-text and CTA inventory | public web images, CTA text, and footer/menu wording are inventoried for bilingual QA | `done_pending_team3_crawl` |
| `BL-S1-T2-01` | Team 2 | Surface lead | `apps/app`, `apps/auth`, `apps/admin`, `packages/ui` | none | text inventory and ownership map | every user-facing text cluster is listed by module, owner, and proposed source location | `ready_for_execution` |
| `BL-S1-T2-02` | Team 2 | UI architecture lead | `packages/ui`, `apps/app/app`, `apps/auth/app`, `apps/admin/app` | `BL-S1-T2-01` | source strategy note | each surface has a chosen controlled-source pattern and no ownership overlap remains ambiguous | `ready_for_execution` |
| `BL-S1-T2-03` | Team 2 | Product copy lead | auth, dashboard, admin navigation, form, empty, and error states | `BL-S1-T2-01` | bilingual registry draft | route-safe copy registry exists for product-critical states and labels | `ready_for_execution` |
| `BL-S1-T3-01` | Team 3 | Validation lead | `scripts`, release docs | none | bilingual release gate design | rules for crawl, hard-code scan, missing-language failure, and report output are published | `in_progress` |
| `BL-S1-T3-02` | Team 3 | QA automation lead | `scripts`, `apps/web`, `content` | `BL-S1-T1-01` | public crawl spec | URL inventory, metadata inventory, alt-text inventory, and text-node extraction approach are locked | `todo` |
| `BL-S1-T3-03` | Team 3 | Release lead | release evidence docs | `BL-S1-T3-01` | founder report template | final report shell exists with the exact 10 required sections from the bilingual command | `todo` |

### Sprint 2 - Controlled-source implementation

| Task ID | Team | Owner role | File/module targets | Dependencies | Output | Definition of done | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `BL-S2-T1-01` | Team 1 | Web lead | `apps/web/app/layout.tsx`, language-switch related public routes, `apps/web/app/lib/localized-metadata.ts` | `BL-S1-T1-02` | route-aware language output | document language, alternates, and page-to-page language transitions behave correctly | `done_pending_team3_crawl` |
| `BL-S2-T1-02` | Team 1 | Content lead | `content/en.json`, `content/vi.json`, any remaining public web copy modules | `BL-S1-T1-02` | tone and terminology lock | CTA, heading, footer, menu, and section terminology match the bilingual codex exactly | `todo` |
| `BL-S2-T1-03` | Team 1 | SEO lead | `packages/seo`, `apps/web/app/**/head.tsx`, schema output | `BL-S1-T1-02`, `BL-S1-T3-02` | bilingual SEO hardening | canonical, hreflang, OG, and schema fields are language-correct across public routes | `todo` |
| `BL-S2-T2-01` | Team 2 | App lead | `apps/app/app/**` | `BL-S1-T2-02` | app controlled-source rollout | dashboard and logged-in app surfaces stop depending on scattered hard-coded public text | `todo` |
| `BL-S2-T2-02` | Team 2 | Auth lead | `apps/auth/app/**`, `apps/app/app/(auth)/**` | `BL-S1-T2-03` | auth copy cleanup | login, magic link, recovery, and verification flows use approved bilingual copy sources | `todo` |
| `BL-S2-T2-03` | Team 2 | Admin lead | `apps/admin/app/**` | `BL-S1-T2-02` | admin copy cleanup | admin navigation, status copy, moderation messaging, and forms use controlled sources | `todo` |
| `BL-S2-T2-04` | Team 2 | Shared UI lead | `packages/ui/**` | `BL-S1-T2-02` | shared UI registry integration | buttons, labels, empty states, and reusable messages stop leaking stale wording into product surfaces | `todo` |
| `BL-S2-T3-01` | Team 3 | Script lead | `scripts/bilingual-source-check.mjs`, `scripts/bilingual-public-audit.mjs`, `scripts/bilingual-hardcode-scan.mjs` | `BL-S1-T3-01`, `BL-S1-T3-02` | runnable audit scripts | scripts detect missing `vi` or `en`, hard-coded public text, and missing metadata fields | `in_progress` |
| `BL-S2-T3-02` | Team 3 | Release lead | release docs, CI/release entrypoints | `BL-S2-T3-01` | publish block | release process fails when bilingual requirements are not met | `todo` |
| `BL-S2-T3-03` | Team 3 | Evidence lead | report generator and evidence docs | `BL-S1-T3-03`, `BL-S2-T3-01` | report draft with live counts | founder-facing counts and unresolved page list can be produced on demand | `todo` |

### Sprint 3 - Four-pass verification and live readiness

| Task ID | Team | Owner role | File/module targets | Dependencies | Output | Definition of done | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `BL-S3-T1-01` | Team 1 | Editor/SEO lead | public web content and metadata evidence | all Sprint 2 Team 1 tasks | Team 1 sign-off pack | AI pass, editor pass, SEO pass, and public copy approval are attached | `todo` |
| `BL-S3-T2-01` | Team 2 | Product QA lead | app/auth/admin evidence | all Sprint 2 Team 2 tasks | Team 2 sign-off pack | form labels, errors, empty states, badges, menus, and route text are verified across owned surfaces | `todo` |
| `BL-S3-T3-01` | Team 3 | QA/release lead | scripts, release docs, founder report | all Sprint 2 Team 3 tasks | final bilingual go/no-go packet | report includes URL count, fixes count, unresolved items, locked language decisions, and live recommendation | `todo` |
| `BL-S3-T3-02` | Team 3 | Release authority | release gate entrypoints | `BL-S3-T1-01`, `BL-S3-T2-01`, `BL-S3-T3-01` | live decision | no live release unless all 3 team sign-offs are attached and the bilingual gate is green | `todo` |

## 6. Handoff contract between teams

| From | To | Required handoff | Blocker if missing |
| --- | --- | --- | --- |
| Team 1 | Team 3 | route inventory, metadata list, alt-text list, unresolved web pages | Team 3 cannot finalize crawl checks or founder counts |
| Team 2 | Team 3 | product text inventory, controlled-source map, unresolved hard-coded clusters | Team 3 cannot enforce product-surface publish gate |
| Team 3 | Team 1 and Team 2 | failing audit output, missing-language report, final gate criteria | Team 1 and Team 2 cannot close Sprint 3 evidence cleanly |

## 7. Daily sync block the dev leads must use

Use this exact dispatch format each day:

`Team`:
`Sprint`:
`Top task IDs today`:
`Files/modules in play`:
`Blocked by`:
`Waiting on handoff from`:
`Expected end-of-day artifact`:

## 8. What each team should do next

### Team 1 next

- hand Team 3 `docs/TEAM_1_BILINGUAL_PUBLIC_WEB_EVIDENCE_2026-04-23.md`
- keep runtime language sync under Team 3 crawl review
- prepare final Team 1 sign-off after rendered metadata, hreflang, schema, and alt output are confirmed

### Team 2 next

- use `docs/OMDALA_TEAM_2_BILINGUAL_FILE_MODULE_EXECUTION_2026-04-23.md`
- publish the full text inventory across `apps/app`, `apps/auth`, `apps/admin`, and `packages/ui`
- choose the controlled-source pattern per surface before broad code edits begin
- prioritize auth, dashboard, admin nav, form, empty-state, and error-state copy

### Team 3 next

- use `docs/OMDALA_TEAM_3_BILINGUAL_GATE_EXECUTION_2026-04-23.md`
- run `npm run bilingual:source-check` after each content-source change
- define the remaining bilingual audit scripts and their output format
- prepare the publish gate criteria before Team 2 starts broad rollout
- create the founder report shell now, so counts land in the right shape from day one

## 9. Release condition

OMDALA is not bilingual-live ready until all of the following are true:

- Team 1 signs off the full public web layer
- Team 2 signs off the app, auth, admin, and shared UI layer
- Team 3 signs off the audit scripts, publish gate, and founder report
- no unresolved bilingual blocker remains without owner and next action
