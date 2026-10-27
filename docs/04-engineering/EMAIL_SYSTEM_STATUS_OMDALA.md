# OMDALA Email System Status
## Verified Status Report
## Date: 2026-03-29

---

# 1. Purpose

This document records the current verified status of the newly added Email system work in the OMDALA repository.

It exists to answer four questions clearly:

- what has already been implemented in code
- what has been verified locally
- what is not yet deployed or production-ready
- what remains before Email can be considered operational end to end

This file reflects the repository state after direct inspection of the working tree and local build checks.

---

# 2. Files Checked

The following Email-related files were inspected directly:

- `.env.example`
- `packages/core/src/mail.ts`
- `packages/core/src/index.ts`
- `apps/web/app/contact/page.tsx`
- `apps/web/app/contact/ContactForm.tsx`
- `apps/web/app/globals.css`
- `apps/app/app/(auth)/login/page.tsx`
- `apps/app/app/(auth)/login/MagicLinkLoginForm.tsx`
- `apps/app/app/(auth)/signup/page.tsx`
- `apps/app/app/(auth)/signup/AccessRequestForm.tsx`
- `apps/app/app/globals.css`
- `services/api/src/index.ts`
- `services/api/wrangler.toml`

---

# 3. What Exists in Code Now

The Email layer is now present in three parts of the system.

## 3.1 Shared mail constants

The system now defines shared mail origins, inboxes, contact topics, and access roles in:

- `packages/core/src/mail.ts`

Current shared inbox set:

- `hello@omdala.com`
- `support@omdala.com`
- `app@omdala.com`
- `docs@omdala.com`
- `trust@omdala.com`
- `admin@omdala.com`
- `noreply@omdala.com`

## 3.2 Public and auth-facing UI flows

The following frontend Email-connected UI flows now exist:

- public contact form
- app login magic-link request form
- app magic-link verification flow
- app access request form

## 3.3 API Email endpoints

The API now contains Email-related endpoints for:

- `POST /v1/contact`
- `POST /v1/auth/access-request`
- `POST /v1/auth/magic-link/request`
- `GET /v1/auth/magic-link`

The API also includes:

- payload validation
- mail payload builders
- HTML/text email templates
- magic-link token signing and verification
- CORS restrictions for first-party OMDALA origins

---

# 4. Verified Checks

## 4.1 Git status

The Email changes are currently still in the working tree and are not yet committed or deployed.

## 4.2 TypeScript checks

The following typechecks passed:

- `@omdala/web`
- `@omdala/app`
- `@omdala/api`

Meaning:

- the Email additions are type-valid at the TypeScript level
- imports and component signatures are currently coherent enough to compile under `tsc --noEmit`

## 4.3 Production build checks

### Passed

- `@omdala/web` build passed successfully

### Failed

- `@omdala/app` build failed during static generation of `/login`

Verified blocker:

- `useSearchParams()` in `MagicLinkLoginForm.tsx` requires a `Suspense` boundary for this build path

Meaning:

- the Email login flow is implemented
- but the app surface is not yet production-build clean with the new magic-link UI

## 4.4 Live deployment status

The currently running Cloudflare Pages demo surfaces were deployed before these local Email changes were committed.

That means the Email additions inspected here are currently:

- present in local code
- not yet synced to Git
- not yet redeployed to the live demo surfaces

---

# 5. Current Findings

## Finding 1 — Build blocker on app login

Severity: High

`apps/app/app/(auth)/login/MagicLinkLoginForm.tsx` uses `useSearchParams()` in a way that currently breaks the static build for `/login`.

Impact:

- `@omdala/app` does not finish production build
- Cloudflare Pages redeploy for the app should not be considered ready yet

## Finding 2 — Email system is implemented locally, but not yet live

Severity: High

The Email files are still unstaged local changes.

Impact:

- GitHub remote does not yet reflect this Email layer
- current Cloudflare demo does not yet represent the Email update

## Finding 3 — Package boundary is inconsistent

Severity: Medium

Some new Email code imports `packages/core` via direct source-relative paths instead of the package entrypoint.

Examples:

- `services/api/src/index.ts`
- `apps/web/app/contact/page.tsx`
- `apps/web/app/contact/ContactForm.tsx`

Impact:

- this is not the clean package boundary used elsewhere
- it may complicate long-term workspace consistency and Worker packaging

## Finding 4 — Runtime secrets and mail delivery ops are not yet verified

Severity: Medium

The code expects:

- `MAIL_API_KEY`
- `MAGIC_LINK_SECRET`

These are environment or secret requirements, not committed values.

Impact:

- Email cannot be confirmed end to end until worker secrets are added and tested

---

# 6. What Has Been Completed So Far Overall

Before the Email layer, the repository had already reached these milestones:

- monorepo foundation
- OMDALA-only brand lock
- public website scaffold
- app scaffold
- admin scaffold
- docs scaffold
- node/resource CRUD shells
- offer/request flows
- admin moderation shells
- trust and matching service shells
- notifications service shell
- AI service shell
- Cloudflare Pages project creation for:
  - `omdala-web`
  - `omdala-app`
  - `omdala-admin`
  - `omdala-docs`
- successful static deployment of those demo surfaces before the Email changes

This means the system is already beyond concept stage.

The current Email work is part of the next integration layer, not the first foundation layer.

---

# 7. Remaining Work for Email

The remaining Email-specific work is now clear.

## 7.1 Code readiness

- fix the `/login` build blocker by handling `useSearchParams()` correctly for Next.js static/export flow
- normalize shared imports to package-level imports where appropriate

## 7.2 Ops readiness

- configure Worker secrets:
  - `MAIL_API_KEY`
  - `MAGIC_LINK_SECRET`
- confirm `MAIL_API_URL` target behavior
- deploy API worker with the new endpoints

## 7.3 Surface deployment

- commit the Email files
- redeploy `app`
- redeploy `web`
- verify that live demo routes reflect the new forms

## 7.4 End-to-end verification

- submit contact form
- submit access request
- request magic link
- open magic link
- confirm worker response and delivery behavior

---

# 8. Practical Status Summary

Current Email status should be described as:

## Code status

Implemented locally

## Type safety status

Verified

## Production build status

Partially verified

## Live deployment status

Not yet synced

## End-to-end mail delivery status

Not yet verified

---

# 9. Final Decision

The Email layer should not yet be called finished.

The accurate status is:

- Email architecture exists
- Email UI flows exist
- Email API routes exist
- local typechecks pass
- public web build passes
- app build is currently blocked at `/login`
- live Cloudflare demo has not yet been updated with these Email files
- secrets and mail delivery still need deployment-time verification

---

# 10. Next Correct Step

The next correct implementation step is:

1. fix the app login build blocker
2. normalize package imports for the new Email layer
3. commit and push the Email changes
4. deploy the API worker with secrets
5. redeploy `web` and `app`
6. run a real end-to-end Email smoke test

Until those steps are complete, Email should be treated as:

implemented in code, but not yet fully live
