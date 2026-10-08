# Team 2 Route Inventory + Redirect Matrix (Provisional)

Date: 2026-04-19
Owner: Team 2
Status: PROVISIONAL (not final lock)

## Dependency gates before FINAL

1. Team 1 naming + CTA authority must be handed off before final route labels/entry copy lock.
2. Team 3 auth/session/runtime contract must be handed off before final redirect/guard lock.
3. Team 2 Sprint 3 cannot be self-closed before evidence pass is delivered to Team 3.

## Scope

- `apps/app` (`app.omdala.com`)
- `apps/auth` (`auth.omdala.com`)
- `apps/admin` (`admin.omdala.com`)

## Route inventory (provisional)

### A. app.omdala.com

Base route constants (shared):

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/nodes`
- `/resources`
- `/trust`
- `/offers`
- `/requests`
- `/profile`
- `/settings`

Source: `packages/core/src/routes.ts`

Observed implemented pages in `apps/app/app`:

- `/(auth)/login`
- `/(auth)/signup`
- `/(dashboard)/dashboard`
- `/(dashboard)/nodes`, `/(dashboard)/nodes/new`, `/(dashboard)/nodes/[nodeId]`, `/(dashboard)/nodes/[nodeId]/edit`
- `/(dashboard)/resources`, `/(dashboard)/resources/new`, `/(dashboard)/resources/[resourceId]`, `/(dashboard)/resources/[resourceId]/edit`
- `/(dashboard)/offers`, `/(dashboard)/offers/new`, `/(dashboard)/offers/[offerId]`, `/(dashboard)/offers/[offerId]/edit`
- `/(dashboard)/requests`, `/(dashboard)/requests/new`, `/(dashboard)/requests/[requestId]`, `/(dashboard)/requests/[requestId]/edit`
- `/(dashboard)/trust`
- `/(dashboard)/profile`
- `/(dashboard)/settings`

Legacy parallel pages still present (route authority risk until cleaned):

- `/nodes` via `apps/app/app/nodes/page.js`
- `/requests` via `apps/app/app/requests/page.js`
- `/trust` via `apps/app/app/trust/page.js`
- `/sign-in` via `apps/app/app/sign-in/page.js`

### B. auth.omdala.com

Observed implemented pages in `apps/auth/app`:

- `/` -> server redirect to `/login`
- `/login`

### C. admin.omdala.com

Observed implemented pages in `apps/admin/app`:

- `/` (overview)
- `/providers`
- `/nodes`
- `/offers`
- `/requests`
- `/proofs`
- `/verifications`

Admin layout currently applies local role gate (`getMockAdminSession` + `hasRequiredRole`) and shows `Access Restricted` fallback when role is missing.

## Redirect + guard matrix (provisional)

| ID | Surface | Trigger | Source path | Behavior | Target | Params | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | app | Missing/expired server session in dashboard shell | `/(dashboard)/*` (via `DashboardAuthGate`) | Client redirect (`window.location.href`) | `https://auth.omdala.com/login` | `lang`, `next=<currentPath+query>` | Verified |
| R2 | app | User opens app login bridge page | `/login` | CTA link out to auth host | `https://auth.omdala.com/login` | `next=<draft.redirectTo>` | Verified |
| R3 | app | Login form opened with `token` query | `/login?token=...` (magic-link form) | Exchange token (`/v1/auth/session/exchange`), then in-app redirect | `data.redirectTo` fallback `/dashboard` | `token`, `next` normalized to internal path | Verified |
| R4 | app | User submits sign-in link request | `/login` (magic-link form) | POST `/v1/auth/magic-link/request` | No immediate route change | `redirectTo` normalized (must start with `/`) | Verified |
| R5 | app | User enters signup page and already has access | `/signup` | Link to login route | `/login` | locale query preserved by `LocaleLink` | Verified |
| R6 | auth | User opens auth root | `/` | Server-side redirect | `/login` | none | Verified |
| R7 | auth | Auth login form opened with `token` query | `/login?token=...` | Exchange token (`/v1/auth/session/exchange`), then cross-subdomain redirect | `https://app.omdala.com${data.redirectTo}` | `token`, `next` normalized to internal path | Verified |
| R8 | auth | User submits sign-in link request | `/login` | POST `/v1/auth/magic-link/request` | No immediate route change | `redirectTo` default from `next` or `/dashboard` | Verified |
| R9 | admin | Missing required role in admin layout | `/*` on admin surface | Render restricted-state panel (no redirect yet) | Stay on current URL | role check via mock session | Verified |

## Current contract assumptions consumed by Team 2

1. `GET /v1/auth/session` returns server session validity used by `DashboardAuthGate`.
2. `POST /v1/auth/magic-link/request` accepts `email` + normalized `redirectTo`.
3. `POST /v1/auth/session/exchange` accepts `token` + `next`, returns `redirectTo`.
4. Auth host is `auth.omdala.com`; app host is `app.omdala.com`.

These assumptions are provisional until Team 3 runtime contract handoff is marked final.

## Provisional risks for handoff

1. Duplicate route paradigm in `apps/app` (grouped routes and legacy `.js` pages) can create ambiguity for Team 1 CTA mapping.
2. Hardcoded auth host redirect in dashboard guard should be validated against Team 3 canonical runtime map.
3. Admin currently uses mock role session gate, not final runtime auth gate.

## Evidence set used

- `packages/core/src/routes.ts`
- `apps/app/app/(dashboard)/DashboardAuthGate.tsx`
- `apps/app/app/(auth)/login/page.tsx`
- `apps/app/app/(auth)/login/MagicLinkLoginForm.tsx`
- `apps/app/app/(auth)/signup/page.tsx`
- `apps/auth/app/page.tsx`
- `apps/auth/app/login/page.tsx`
- `apps/auth/app/login/AuthLoginForm.tsx`
- `apps/admin/app/layout.tsx`
- `apps/admin/app/page.tsx`

## Exit criteria from PROVISIONAL to FINAL

1. Team 1 confirms naming and CTA authority against this route inventory.
2. Team 3 confirms auth/session/runtime contract against this redirect matrix.
3. Team 2 reruns verification and submits evidence pass to Team 3 release gate.

## Linked handoff packets

- Team 1 packet: `docs/TEAM2_HANDOFF_TEAM1_CTA_NAMING_PROVISIONAL_2026-04-19.md`
- Team 3 packet: `docs/TEAM2_HANDOFF_TEAM3_RUNTIME_CONTRACT_CHECKLIST_PROVISIONAL_2026-04-19.md`
