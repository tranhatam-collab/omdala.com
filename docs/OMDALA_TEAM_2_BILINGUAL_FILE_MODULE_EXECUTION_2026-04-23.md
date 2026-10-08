# OMDALA Team 2 Bilingual File-Module Execution

Date: April 23, 2026
Status: Active dispatch
Scope: Team 2 bilingual lane for product surfaces and shared UI

Use this file to execute `BL-S1-T2-01`, `BL-S1-T2-02`, `BL-S1-T2-03`, and the Team 2 Sprint 2 rollout tasks from `docs/OMDALA_BILINGUAL_3_TEAM_SYNC_EXECUTION_2026-04-22.md`.

## 1. Team 2 rule for this lane

Team 2 must not rewrite broad product logic while doing bilingual cleanup. The first pass is inventory, ownership, and source strategy. Code changes come after the source pattern is explicit.

## 2. Sprint 1 tasks Team 2 must close first

| Task ID | Owner | File/module scope | Output artifact | Done when |
| --- | --- | --- | --- | --- |
| `BL-S1-T2-01` | Surface lead | `apps/app`, `apps/auth`, `apps/admin`, `packages/ui` | `docs/TEAM_2_BILINGUAL_TEXT_INVENTORY_2026-04-23.md` | every user-facing text cluster is listed with file path, surface, text type, and proposed owner |
| `BL-S1-T2-02` | UI architecture lead | `packages/ui`, product app layouts and shared components | `docs/TEAM_2_BILINGUAL_SOURCE_STRATEGY_2026-04-23.md` | every owned surface has one chosen source pattern and no ambiguous ownership remains |
| `BL-S1-T2-03` | Product copy lead | auth, dashboard, admin, form, empty, and error states | `docs/TEAM_2_BILINGUAL_PRODUCT_COPY_REGISTRY_2026-04-23.md` | product-critical states have draft `vi` and `en` registry entries ready for implementation |

## 3. Inventory order

### Pass A - Shared UI boundary

Start here so product surfaces do not each invent a different source pattern.

Files/modules:

- `packages/ui/src/index.ts`
- `packages/ui/src/components/DocumentLanguageSync.tsx`
- `packages/ui/src/components/LinkSEO.tsx`
- `packages/ui/src/components/SchemaScript.tsx`

What to collect:

- reusable labels
- aria labels
- schema-visible names and descriptions
- default fallback messages
- props that currently accept raw text and should accept registry keys later

### Pass B - Auth and access flows

Files/modules:

- `apps/auth/app/login/AuthLoginForm.tsx`
- `apps/auth/app/login/page.tsx`
- `apps/auth/app/page.tsx`
- `apps/app/app/(auth)/login/MagicLinkLoginForm.tsx`
- `apps/app/app/(auth)/login/page.tsx`
- `apps/app/app/(auth)/signup/AccessRequestForm.tsx`
- `apps/app/app/(auth)/signup/page.tsx`
- `apps/app/app/sign-in/page.js`
- `apps/app/components/magic-link-form.js`

Text clusters:

- form labels
- placeholders
- submit buttons
- success states
- error states
- recovery and redirect messages
- email or magic-link confirmation copy

### Pass C - Dashboard product surfaces

Files/modules:

- `apps/app/app/(dashboard)/layout.tsx`
- `apps/app/app/(dashboard)/DashboardAuthGate.tsx`
- `apps/app/app/(dashboard)/dashboard/page.tsx`
- `apps/app/app/(dashboard)/nodes/**`
- `apps/app/app/(dashboard)/offers/**`
- `apps/app/app/(dashboard)/requests/**`
- `apps/app/app/(dashboard)/resources/**`
- `apps/app/app/(dashboard)/profile/**`
- `apps/app/app/(dashboard)/settings/**`
- `apps/app/app/(dashboard)/trust/page.tsx`
- `apps/app/components/app-frame.js`
- `apps/app/components/app-nav.js`
- `apps/app/components/live-api-panel.js`
- `apps/app/lib/vi-labels.ts`

Text clusters:

- navigation
- table headings
- filters
- status labels
- empty states
- validation messages
- permission messages
- loading messages
- profile and settings confirmations

### Pass D - Admin surfaces

Files/modules:

- `apps/admin/app/layout.tsx`
- `apps/admin/app/page.tsx`
- `apps/admin/app/nodes/page.tsx`
- `apps/admin/app/offers/page.tsx`
- `apps/admin/app/requests/page.tsx`
- `apps/admin/app/proofs/page.tsx`
- `apps/admin/app/providers/page.tsx`
- `apps/admin/app/providers/ProviderObservabilityDashboard.tsx`
- `apps/admin/app/verifications/page.tsx`
- `apps/admin/app/components/LanguageSwitcher.tsx`
- `apps/admin/app/components/LocaleLink.tsx`

Text clusters:

- admin navigation
- moderation statuses
- provider observability labels
- verification status copy
- table column names
- empty states
- permission and role messaging

## 4. Required inventory table format

Team 2 must use this exact table in `docs/TEAM_2_BILINGUAL_TEXT_INVENTORY_2026-04-23.md`:

| Surface | File | Text type | Current text summary | Risk | Proposed source | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |

Risk values:

- `P0`: blocks login, auth, admin action, or billing/session recovery
- `P1`: public or product-critical user-facing copy
- `P2`: internal admin or low-risk repeated UI text

Status values:

- `found`
- `source_decided`
- `copy_ready`
- `implemented`
- `verified`

## 5. Implementation rule after inventory

Do not create a new abstraction per page. Prefer one shared Team 2 source pattern:

- product app: `apps/app/lib/bilingual-copy.ts` or equivalent local registry
- auth: shared auth copy source consumed by both `apps/auth` and `apps/app/(auth)`
- admin: local admin copy source or shared registry if it does not leak into public web
- shared UI: component props accept resolved copy, while default user-facing copy stays in owned registries

## 6. Handoff to Team 3

Team 2 must hand Team 3:

- inventory artifact path
- chosen source strategy path
- unresolved hard-coded text list
- any pages intentionally deferred with owner and date

Team 3 cannot enforce the bilingual product gate until these artifacts exist.
