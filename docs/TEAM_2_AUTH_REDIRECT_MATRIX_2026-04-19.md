# TEAM 2 Auth Redirect Matrix

Date: April 19, 2026
Owner: Team 2
Sprint task: `S1-T2-02`
Scope: `apps/app`, `apps/auth`, auth entry and return flows

## 1. Purpose

Publish one redirect matrix for all auth states so Team 3 can lock runtime/session behavior and Team 1 can link to valid auth entry paths.

## 2. Redirect contract

- Canonical auth host: `https://auth.omdala.com/login`
- Protected surfaces pass `next=<encoded-path>` to auth host.
- Successful exchange returns to `redirectTo` from API response when valid, otherwise falls back to `/dashboard`.
- Invalid or expired link stays on auth surface with explicit error state.

## 3. State matrix

| Current state | Entry path | Condition | Redirect target | Owner |
| --- | --- | --- | --- | --- |
| Unauthenticated user opens protected app page | `app.omdala.com/(dashboard)/*` | no valid server session | `auth.omdala.com/login?next=<current-path>` | Team 2 + Team 3 |
| Unauthenticated user opens app login bridge | `app.omdala.com/(auth)/login` | always | `auth.omdala.com/login?next=<requested-target>` | Team 2 |
| User submits email for magic link | `auth.omdala.com/login` | valid request | stays on `auth.omdala.com/login` with sent confirmation | Team 2 |
| User opens magic link callback | `auth.omdala.com/login` with token params | exchange succeeds | `redirectTo` from `/v1/auth/session/exchange`, fallback `/dashboard` | Team 2 + Team 3 |
| User opens invalid or expired link | `auth.omdala.com/login` with token params | exchange fails | stay on `auth.omdala.com/login` with invalid-link error | Team 2 |
| Session valid, user opens app root | `app.omdala.com/` | has valid session | `/(dashboard)/dashboard` render path | Team 2 |
| Session expired during dashboard usage | `app.omdala.com/(dashboard)/*` | client/server session invalid | `auth.omdala.com/login?next=<current-path>` | Team 2 + Team 3 |

## 4. Implementation anchors

- `apps/app/app/(auth)/login/page.tsx`
- `apps/app/app/(auth)/login/MagicLinkLoginForm.tsx`
- `apps/app/app/(dashboard)/DashboardAuthGate.tsx`
- `apps/auth/app/login/page.tsx`
- `apps/auth/app/login/AuthLoginForm.tsx`
- `apps/app/lib/session-client.ts`

## 5. Safety rules

- `next` must be normalized to safe in-scope paths only.
- Cross-domain redirect outside `*.omdala.com` is not allowed.
- Auth errors must not silently drop the user; a visible recovery action is required.

## 6. Handoff outputs

- Team 2 shares matrix with Team 3 to finalize auth/session runtime contract.
- Team 2 shares matrix with Team 1 so public/docs links use valid auth entry paths.

Status: `published` (Sprint 1 closure candidate for `S1-T2-02`)
