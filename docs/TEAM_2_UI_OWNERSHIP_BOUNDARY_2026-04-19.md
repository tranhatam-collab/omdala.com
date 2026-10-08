# TEAM 2 UI Ownership Boundary

Date: April 19, 2026
Owner: Team 2
Sprint task: `S1-T2-03`
Scope: `packages/ui`, app/auth/admin shared UI usage

## 1. Purpose

Publish ownership boundaries for shared UI so teams can ship in parallel without route logic, naming logic, or runtime behavior leaking across layers.

## 2. Shared component inventory in active use

Core shared package:

- `packages/ui/src/components/LinkSEO.tsx`
- `packages/ui/src/components/DocumentLanguageSync.tsx`
- `packages/ui/src/components/SchemaScript.tsx`
- `packages/ui/src/index.ts`

Surface-level shared components:

- `apps/app/app/components/LanguageSwitcher.tsx`
- `apps/app/app/components/LocaleLink.tsx`
- `apps/admin/app/components/LanguageSwitcher.tsx`
- `apps/admin/app/components/LocaleLink.tsx`
- `apps/auth/app/login/AuthLoginForm.tsx`

## 3. Ownership model

| Layer | DRI | Responsibility |
| --- | --- | --- |
| `packages/ui` shared primitives | Team 2 | reusable behavior, stable props, no route-side effects |
| Public naming and content strings | Team 1 | naming and copy authority |
| Runtime/auth/session behavior contracts | Team 3 | guard, issuer, cookie, session rules |
| App/auth/admin surface composition | Team 2 | route-aware composition and page wiring |

## 4. Hard boundaries

- Shared UI must not hardcode route redirects.
- Shared UI must not embed auth/session business logic.
- Shared UI must not become a source of truth for branding terminology.
- Surface pages may compose shared UI, but route and session decisions live at surface/runtime layers.

## 5. Allowed and forbidden patterns

Allowed:

- pure display and layout components
- locale-aware rendering with injected props
- schema and metadata helpers that do not mutate routing behavior

Forbidden:

- direct redirection inside shared primitive components
- implicit API calls tied to auth/session without explicit contract layer
- mixed ownership where copy and behavior change in the same shared primitive without team sign-off

## 6. Team handoff requirements

- Team 2 provides shared component change notes in each Sprint 2 cycle.
- Team 1 signs off naming-sensitive UI text changes.
- Team 3 signs off runtime-sensitive UI state changes.

Status: `published` (Sprint 1 closure candidate for `S1-T2-03`)
