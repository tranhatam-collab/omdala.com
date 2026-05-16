# OMDALA Dev Team Execution Plan

Effective date: April 17, 2026
Scope: OMDALA platform only
Owner: Tran Ha Tam

## 1. Mission

Ship `omdala.com` as a clean standalone platform with:

- clear public positioning
- stable docs, app, auth, and admin surfaces
- production-safe API and shared services
- clean repo scope with no mixed-brand drift
- repeatable release and QA process

This plan does not assign work for any non-OMDALA platform.

## 2. Product surfaces in scope

- `omdala.com`
- `docs.omdala.com`
- `app.omdala.com`
- `auth.omdala.com`
- `admin.omdala.com`
- `api.omdala.com`

## 3. Team structure

### Team 1 — Web, Brand, and SEO

Owns:

- `apps/web`
- `packages/seo`
- public homepage copy
- metadata, sitemap, robots, schema, canonical rules

Must deliver:

- independent OMDALA brand positioning
- clean public IA and CTA structure
- no mixed-brand or external-domain wording
- production-ready SEO output

### Team 2 — Docs, App, Auth, and Admin Surfaces

Owns:

- `apps/docs`
- `apps/app`
- `apps/auth`
- `apps/admin`
- shared route and session UX at the surface layer

Must deliver:

- stable docs navigation and content structure
- app/auth/admin route clarity
- consistent session entry and sign-in flow
- no stale legacy handoff assumptions in user-facing surfaces

### Team 3 — Platform Core and API

Owns:

- `services/api`
- `services/auth`
- `services/trust`
- `services/matching`
- `services/notifications`
- `services/ai`
- `packages/core`
- `packages/types`
- `infra/*`

Must deliver:

- stable API contracts
- auth/session correctness
- trust, matching, and notification baselines
- typed shared contracts for all OMDALA surfaces
- no external-domain assumptions in runtime logic

### Team 4 — QA, Release, and Ops

Owns:

- smoke verification
- release verification
- deploy scripts
- environment checks
- production readiness evidence

Primary files:

- `scripts/*`
- Playwright and smoke tests
- release and rollback docs

Must deliver:

- repeatable verification matrix
- release checklist with named owner
- production smoke coverage for web/app/api
- rollback-ready deployment flow

## 4. Cross-team hard rules

- no planning or implementation for non-OMDALA platforms in this repo
- no mixed-brand copy in public surfaces
- no route, auth, or cookie assumptions outside `*.omdala.com`
- no new doc becomes canonical unless linked from the source-of-truth index
- every team must remove stale references in its owned files before adding new work

## 5. Execution lanes

### Lane A — Repo cleanup and scope discipline

Owner:

- all teams, coordinated by Team 4

Tasks:

- remove stale external-domain references from docs
- remove mixed-scope handoff assumptions
- keep only OMDALA-relevant source-of-truth documents
- verify `rg` search for forbidden legacy references is clean

### Lane B — Public web and SEO

Owner:

- Team 1

Tasks:

- lock homepage positioning
- align metadata and OG defaults
- verify sitemap, robots, and schema
- review all landing pages for naming consistency

### Lane C — Surface coherence

Owner:

- Team 2

Tasks:

- align docs/app/auth/admin language and route authority
- remove obsolete assumptions from legacy handoff documents
- verify docs and app do not rely on external brand flow

### Lane D — API and shared contracts

Owner:

- Team 3

Tasks:

- freeze auth/session contract
- validate cookie and issuer scope under `*.omdala.com`
- confirm app IDs, service names, and runtime labels stay OMDALA-only
- review release-safe defaults in API/service config

### Lane E — Verification and release

Owner:

- Team 4

Tasks:

- run typecheck/build/release verification
- verify production deploy flow
- capture smoke evidence
- document blockers such as DNS, credentials, or Cloudflare access

## 6. Sprint plan

### Sprint 1 — Scope cleanup

- clean repo docs and remove stale mixed-scope references
- lock README and source-of-truth index
- replace legacy handoff docs with OMDALA-only guidance

### Sprint 2 — Surface completion

- finish homepage, docs, app, auth, and admin coherence
- review SEO, metadata, and route authority
- ensure user-facing copy reads as one independent platform

### Sprint 3 — Release readiness

- run verification matrix
- fix remaining contract drift
- confirm deployment scripts and rollback path
- publish live updates when network and credentials allow

## 7. Definition of done

The OMDALA team is done when:

- public OMDALA copy stands on its own
- repo docs no longer contain stale mixed-brand references
- surfaces build and typecheck cleanly
- release flow is documented and testable
- every team has clear ownership and no blocked scope ambiguity

## 8. Founder summary

From this point forward, the OMDALA team should work as one clean platform organization:

- Team 1 protects brand and public web
- Team 2 protects surface coherence
- Team 3 protects contracts and backend integrity
- Team 4 protects release quality and operational safety
