# TEAM 2 Route Authority Artifact

Date: April 19, 2026
Owner: Team 2
Sprint task: `S1-T2-01`
Scope: `apps/app`, `apps/auth`, `apps/admin`

## 1. Purpose

Lock route authority so Team 1 and Team 3 can consume one stable map for CTA, docs links, and session/runtime contracts.

## 2. Authority rules

- `app.omdala.com` owns product routes.
- `auth.omdala.com` owns authentication entry.
- `admin.omdala.com` owns operator and moderation routes.
- Any unauthenticated product path must route through auth entry and return with a safe `next`.

## 3. App route inventory (`apps/app/app`)

Primary entry:

- `/`
- `/sign-in`
- `/(auth)/login`
- `/(auth)/signup`

Dashboard group:

- `/(dashboard)/dashboard`
- `/(dashboard)/profile`
- `/(dashboard)/settings`
- `/(dashboard)/trust`

Domain groups:

- `/(dashboard)/resources`
- `/(dashboard)/resources/new`
- `/(dashboard)/resources/[resourceId]`
- `/(dashboard)/resources/[resourceId]/edit`
- `/(dashboard)/offers`
- `/(dashboard)/offers/new`
- `/(dashboard)/offers/[offerId]`
- `/(dashboard)/offers/[offerId]/edit`
- `/(dashboard)/requests`
- `/(dashboard)/requests/new`
- `/(dashboard)/requests/[requestId]`
- `/(dashboard)/requests/[requestId]/edit`
- `/(dashboard)/nodes`
- `/(dashboard)/nodes/new`
- `/(dashboard)/nodes/[nodeId]`
- `/(dashboard)/nodes/[nodeId]/edit`

Legacy compatibility pages present:

- `/trust`
- `/requests`
- `/nodes`

## 4. Auth route inventory (`apps/auth/app`)

- `/`
- `/login`

Auth owner note:

- `/login` is canonical auth entry.
- `next` param is required for deep-link return to protected app/admin paths.

## 5. Admin route inventory (`apps/admin/app`)

- `/`
- `/nodes`
- `/offers`
- `/requests`
- `/proofs`
- `/verifications`
- `/providers`

## 6. Cross-surface route ownership

| Route family | DRI | Notes |
| --- | --- | --- |
| Product routes under `app.omdala.com` | Team 2 | protected by session gate |
| Auth routes under `auth.omdala.com` | Team 2 | runtime behavior must follow Team 3 contract |
| Admin routes under `admin.omdala.com` | Team 2 | role messaging and guard behavior must be coherent |
| Public CTA links pointing to app/auth/admin | Team 1 | must consume this artifact for link targets |

## 7. Handoff outputs

Team 2 publishes this artifact to:

- Team 1 for docs and CTA authority
- Team 3 for auth/session and release gate alignment

Status: `published` (Sprint 1 closure candidate for `S1-T2-01`)
