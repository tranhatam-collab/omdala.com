# OMDALA Execution Board By Sprint

Effective date: April 19, 2026
Scope: OMDALA platform only
Model: 3-team execution

Use together with:

- `OMDALA_DEV_TEAM_EXECUTION_PLAN_2026-04-17.md`
- `OMDALA_3_TEAM_DELIVERY_BACKLOG_2026-04-19.md`
- `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md`
- `OMDALA_IMPLEMENTATION_CHECKLIST_BY_SURFACE_2026-04-19.md`

## 1. How dev leads use this board

Each row is a directly assignable work item.

- status values: `todo`, `in_progress`, `blocked`, `done`
- one owner per task
- dependencies must be resolved or explicitly accepted before execution
- a task is complete only when `Definition of done` is satisfied

## 2. Sprint 1 board — Cleanup and authority lock

| Task ID | Team | Owner role | Module/File targets | Dependencies | Output | Definition of done | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `S1-T1-01` | Team 1 | Web lead | `apps/web/app/lib/content.ts`, `apps/web/app/WebChrome.tsx`, `apps/web/app/page.tsx` | none | locked homepage copy set | public copy is OMDALA-only and approved by Team 1 | `todo` |
| `S1-T1-02` | Team 1 | Docs lead | `apps/docs/app/page.tsx`, `apps/docs/app/platform/page.tsx`, `apps/docs/app/api/page.tsx` | `S1-T2-01` | docs IA v1 | docs routes and wording align with Team 2 route inventory | `todo` |
| `S1-T1-03` | Team 1 | SEO lead | `packages/seo/src/constants.ts`, `packages/seo/src/metadata.ts`, `packages/seo/src/schema.ts`, `apps/web/app/sitemap.ts`, `apps/web/app/robots.ts` | `S1-T3-01` | canonical SEO rule set | canonical host, schema, sitemap, robots match runtime scope | `todo` |
| `S1-T2-01` | Team 2 | Surface lead | `apps/app/app/layout.tsx`, `apps/auth/app/layout.tsx`, `apps/admin/app/layout.tsx`, `apps/app/lib/static-params.ts` | none | route inventory and authority map | route map published and shared with Team 1 and Team 3 | `done_pending_signoff` |
| `S1-T2-02` | Team 2 | Auth lead | `apps/auth/app/login/page.tsx`, `apps/auth/app/login/AuthLoginForm.tsx`, `apps/app/app/(auth)/login/page.tsx`, `apps/app/app/(auth)/login/MagicLinkLoginForm.tsx` | `S1-T3-02` | redirect matrix v1 | sign-in and redirect outcomes documented for every auth state | `done_pending_signoff` |
| `S1-T2-03` | Team 2 | UI lead | `packages/ui/src/index.ts`, `packages/ui/src/components/DocumentLanguageSync.tsx`, `packages/ui/src/components/LinkSEO.tsx` | none | shared UI ownership list | shared components classified by public vs product usage | `done_pending_signoff` |
| `S1-T3-01` | Team 3 | Platform lead | `services/api/src/index.ts`, `services/api/src/contracts.ts`, `services/auth/src/session.ts`, `packages/types/src/index.ts` | none | runtime domain and contract inventory | domain and API contract scope documented under `*.omdala.com` | `todo` |
| `S1-T3-02` | Team 3 | Auth runtime lead | `services/auth/src/jwt.ts`, `services/auth/src/magic-link.ts`, `services/auth/src/session.ts`, `services/api/src/provider-registry.ts` | none | auth/session contract v1 | cookie, issuer, and session behaviors are explicit and versioned | `todo` |
| `S1-T3-03` | Team 3 | Release lead | `scripts/release_verify.sh`, `scripts/release_deploy.sh`, `scripts/verify-api-omdala.sh`, `scripts/cloudflare-pages-deploy.mjs` | none | blocker register and release checklist | release gate file lists blockers with owner and next action | `todo` |

## 3. Sprint 2 board — Integrated implementation

| Task ID | Team | Owner role | Module/File targets | Dependencies | Output | Definition of done | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `S2-T1-01` | Team 1 | Web lead | `apps/web/app/what-is-omdala/page.tsx`, `apps/web/app/trust/page.tsx`, `apps/web/app/how-it-works/page.tsx`, `apps/web/app/faq/page.tsx` | `S1-T2-01` | aligned public IA and CTA mapping | every CTA target exists in current route inventory | `todo` |
| `S2-T1-02` | Team 1 | Docs lead | `apps/docs/app/trust/page.tsx`, `apps/docs/app/components/LocaleLink.tsx`, `apps/docs/app/components/LanguageSwitcher.tsx` | `S1-T3-01` | docs language and linking coherence | docs cross-links match contract names and active routes | `todo` |
| `S2-T1-03` | Team 1 | SEO lead | `apps/web/app/head.tsx`, `apps/web/app/seo-head.tsx`, `apps/web/app/lib/localized-metadata.ts` | `S1-T3-01`, `S1-T3-02` | metadata and social output lock | metadata output is consistent across default and localized pages | `todo` |
| `S2-T2-01` | Team 2 | App lead | `apps/app/app/(dashboard)/layout.tsx`, `apps/app/app/(dashboard)/dashboard/page.tsx`, `apps/app/app/(dashboard)/settings/page.tsx` | `S1-T2-01`, `S1-T3-02` | dashboard route and state coherence | dashboard entry, fallback, and settings flows are consistent | `todo` |
| `S2-T2-02` | Team 2 | Auth lead | `apps/auth/app/page.tsx`, `apps/auth/app/login/page.tsx`, `apps/app/app/sign-in/page.js`, `apps/app/lib/session-client.ts` | `S1-T3-02` | session recovery and redirect stability | auth recovery scenarios return users to valid protected routes | `todo` |
| `S2-T2-03` | Team 2 | Admin lead | `apps/admin/app/layout.tsx`, `apps/admin/app/providers/page.tsx`, `apps/admin/app/verifications/page.tsx`, `apps/admin/app/nodes/page.tsx` | `S1-T3-01` | admin IA and permission messaging pass | admin navigation and role messaging are coherent | `todo` |
| `S2-T2-04` | Team 2 | UI lead | `packages/ui/src/components/SchemaScript.tsx`, `packages/ui/src/components/LinkSEO.tsx`, `apps/app/app/components/LocaleLink.tsx`, `apps/admin/app/components/LocaleLink.tsx` | `S1-T1-01` | shared component cleanup | no stale naming or route logic leaks through shared UI | `todo` |
| `S2-T3-01` | Team 3 | API lead | `services/api/src/index.ts`, `services/api/src/db/reality-repository.ts`, `services/api/src/db/client.ts`, `services/api/src/db/errors.ts` | `S1-T3-01` | contract-safe API baseline | API responses align with shared types and route scope | `todo` |
| `S2-T3-02` | Team 3 | Types lead | `packages/types/src/index.ts`, `packages/types/src/om-ai.ts`, `packages/types/src/omniverse.ts`, `packages/core/src/routes.ts`, `packages/core/src/navigation.ts` | `S2-T3-01`, `S1-T2-01` | shared contract lock | typed contracts consumed cleanly by app/auth/admin | `todo` |
| `S2-T3-03` | Team 3 | Release lead | `scripts/smoke_v2_reality.sh`, `scripts/smoke_v2_reality_ci.sh`, `scripts/smoke_v2_reality_trace_request.sh`, `scripts/smoke_v2_reality_chain.sh` | `S2-T1-01`, `S2-T2-01`, `S2-T3-01` | smoke matrix v1 | smoke commands and expected outcomes are documented and rerunnable | `todo` |

## 4. Sprint 3 board — Verification and live release

| Task ID | Team | Owner role | Module/File targets | Dependencies | Output | Definition of done | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `S3-T1-01` | Team 1 | Web+Docs lead | `apps/web/e2e/language-switch.spec.ts`, `apps/web/playwright.config.ts`, `apps/docs/public/robots.txt`, `apps/web/public/robots.txt` | all Sprint 2 Team 1 tasks | Team 1 sign-off evidence | public and docs surfaces are verified as brand-clean | `todo` |
| `S3-T2-01` | Team 2 | Product lead | `apps/app/e2e/smoke-auth-dashboard.spec.ts`, `apps/app/playwright.config.ts`, `apps/auth/lib/api-client.ts`, `apps/app/lib/api-client.ts` | all Sprint 2 Team 2 tasks | Team 2 sign-off evidence | app/auth/admin route and session flow evidence is complete | `todo` |
| `S3-T3-01` | Team 3 | API+QA lead | `services/api/src/index.v2.test.ts`, `services/api/src/index.v2.db-errors.test.ts`, `services/api/src/shared-core-contracts.test.ts`, `services/api/src/provider-routing.test.ts` | all Sprint 2 Team 3 tasks | API/runtime verification report | contract tests pass and are attached to release evidence | `todo` |
| `S3-T3-02` | Team 3 | Release lead | `scripts/release_verify.sh`, `scripts/release_deploy.sh`, `scripts/verify-api-omdala.sh`, `docs/TEAM_3_RELEASE_EVIDENCE_2026-04-19.md`, `docs/TEAM_3_BLOCKER_REGISTER_2026-04-19.md` | `S3-T1-01`, `S3-T2-01`, `S3-T3-01` | go/no-go package | release decision includes blocker status, sign-offs, and rollback notes | `todo` |

## 5. Daily dispatch block for dev leads

Use this short dispatch format at the start of each day:

`Team`:
`Sprint`:
`Top 3 task IDs today`:
`Blocked by`:
`Needs handoff from`:
`Expected end-of-day output`:

## 6. Release readiness condition

No production release starts until these are true:

- Team 1 marks all Sprint 3 Team 1 tasks as `done`
- Team 2 marks all Sprint 3 Team 2 tasks as `done`
- Team 3 marks all Sprint 3 Team 3 tasks as `done`
- blocker register has no unresolved item without owner and next action
