# Team 2 Bilingual Source Strategy - 2026-04-23

## Decision Summary

Team 2 locks one controlled-source strategy per owned surface:

| Surface | Chosen source pattern | Runtime resolver | Ownership |
| --- | --- | --- | --- |
| Shared UI (`packages/ui`) | package-level bilingual registry files under `packages/ui/src/copy/*` | `pickBilingualValue` + `resolveLanguageFromSearchParams` | Team 2 Shared UI lead |
| Auth shared across `apps/auth` and `apps/app/(auth)` | shared auth registry in `packages/ui/src/copy/auth-copy.ts` | client-side `resolveLanguage(...)` + `pickBilingualValue(...)` | Team 2 Auth lead |
| Product app dashboard (`apps/app`) | app-local controlled source in `apps/app/lib/bilingual-copy.ts` + enum labels in `apps/app/lib/vi-labels.ts` | server/client resolver via `resolvePageLanguage(...)` and `t(...)` | Team 2 App lead |
| Admin (`apps/admin`) | admin-local controlled source in `apps/admin/app/lib/admin-copy.ts` | server resolver via `resolveAdminLanguage(...)` and `t(...)` | Team 2 Admin lead |

No page-level new abstraction is allowed outside these source files unless the text is temporary and tracked in the unresolved list.

## Source Files (Locked)

### Shared UI source files

- `packages/ui/src/copy/bilingual.ts`
- `packages/ui/src/copy/shared-ui-copy.ts`
- `packages/ui/src/index.ts` (export boundary)

### Auth source files

- `packages/ui/src/copy/auth-copy.ts`

### Product app source files

- `apps/app/lib/bilingual-copy.ts`
- `apps/app/lib/vi-labels.ts` (upgraded to bilingual-aware enum labels)

### Admin source files

- `apps/admin/app/lib/admin-copy.ts`

## Consumption Rules

1. Pages/components must consume copy from the source registry; avoid local inline `copy` objects unless flagged in unresolved list.
2. Shared UI components should not embed business copy; they accept resolved text or consume shared UI registry keys only.
3. Auth copy must be shared between `apps/auth` and `apps/app/(auth)` from one source file.
4. App dashboard server pages must read language via `resolvePageLanguage(...)` where feasible; client pages use `resolveLanguage(...)`.
5. Admin pages read language via `resolveAdminLanguage(...)`; layout-level copy defaults to controlled-source English until route-aware layout localization is added.

## Status of Strategy Rollout

| Lane | Status | Notes |
| --- | --- | --- |
| Shared UI registry | implemented | language switchers now consume shared UI source |
| Auth shared source | implemented | login/magic-link/access-request copy no longer duplicated across auth surfaces |
| Dashboard source rollout | in_progress | layout, auth gate, dashboard home, trust page migrated; nodes/offers/requests/resources/profile/settings still partially inline |
| Admin source rollout | implemented (core) | layout + overview + moderation pages migrated; provider observability labels now localized in-page |

## Ambiguity Resolution

- `packages/ui` owns reusable UI copy and bilingual resolver primitives.
- `apps/app` owns product workflow copy and enum/domain labels.
- `apps/auth` and `apps/app/(auth)` do not own copy separately; both consume `packages/ui/src/copy/auth-copy.ts`.
- `apps/admin` owns moderation/admin-only copy and does not leak admin registry into public web surfaces.

## Deferred Strategy Items

- Extract remaining dashboard entity/form/detail copy (`nodes/offers/requests/resources/profile/settings`) into `apps/app/lib/bilingual-copy.ts` sections.
- Migrate legacy app auth shell files (`app/sign-in`, `components/magic-link-form`) into shared auth source.
