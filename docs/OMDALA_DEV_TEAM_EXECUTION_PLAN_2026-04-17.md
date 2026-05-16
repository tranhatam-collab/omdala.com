# OMDALA Dev Team Execution Plan

Effective date: April 17, 2026
Revision: April 19, 2026
Scope: OMDALA platform only
Owner: Tran Ha Tam

## 1. Mission

Ship `omdala.com` as a fully independent platform with:

- clear OMDALA public positioning
- coherent public and logged-in surfaces
- stable API, auth, and shared contracts
- release-safe deployment and QA ownership
- zero planning drift toward non-OMDALA platforms

This repository does not plan, deliver, or govern any non-OMDALA platform.

## 2. Target outcomes

The operating target is:

- one brand system for `OMDALA`
- one route authority across `web`, `docs`, `app`, `auth`, and `admin`
- one contract authority across API, services, shared types, and environment scope
- one release gate with named owners and verifiable evidence

## 3. Product surfaces in scope

- `omdala.com`
- `docs.omdala.com`
- `app.omdala.com`
- `auth.omdala.com`
- `admin.omdala.com`
- `api.omdala.com`

## 4. Three-team operating model

### Team 1 — Brand, Web, Docs, and SEO

Owns:

- `apps/web`
- `apps/docs`
- `packages/seo`
- public information architecture
- homepage and docs copy
- metadata, sitemap, robots, schema, and canonical rules

Must deliver:

- independent OMDALA brand positioning
- one naming system across public pages and docs
- clean CTA flow from public web into product surfaces
- no mixed-brand or external-domain wording in owned files
- production-ready SEO output for public and docs surfaces

### Team 2 — Product Surfaces and Shared UI

Owns:

- `apps/app`
- `apps/auth`
- `apps/admin`
- `packages/ui`
- surface route inventory
- session entry, redirect, and dashboard UX at the interface layer

Must deliver:

- stable app, auth, and admin route authority
- consistent sign-in, sign-out, redirect, and session recovery flows
- clean dashboard and settings IA
- no stale legacy labels in product-facing interfaces
- reusable UI patterns aligned with OMDALA naming and permissions

### Team 3 — Platform Core, API, QA, and Release

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
- `scripts/*`
- smoke verification
- deploy verification
- release evidence and rollback readiness

Must deliver:

- stable API and auth contracts
- domain, cookie, issuer, and environment correctness under `*.omdala.com`
- typed shared contracts for all OMDALA surfaces
- release and smoke gates that can be rerun by the team
- documented blockers for DNS, credentials, or deploy access

## 5. Cross-team hard rules

- no planning or implementation for non-OMDALA platforms in this repo
- no mixed-brand copy in public or product surfaces
- no route, auth, cookie, or issuer assumptions outside `*.omdala.com`
- no new document becomes canonical unless linked from the source-of-truth index
- every team must remove stale references in owned files before adding new work
- Team 3 owns the release gate, but Team 1 and Team 2 must provide sign-off evidence before release

## 6. Handoff contract between the three teams

The teams move together on three mandatory handoff artifacts:

### Artifact A — Naming and public authority

Owner:

- Team 1

Must publish:

- canonical naming list for `OMDALA`, `Om AI`, and `AI Omniverse`
- approved homepage and docs copy set
- metadata and canonical URL rules

Feeds:

- Team 2 route labels and user-facing copy
- Team 3 service labels, env names, and release notes

### Artifact B — Route and session map

Owner:

- Team 2

Must publish:

- route inventory for `app`, `auth`, and `admin`
- redirect matrix for sign-in, sign-out, session expiry, and protected routes
- shared UI ownership list for `packages/ui`

Feeds:

- Team 1 docs navigation and CTA routing
- Team 3 auth/session and cookie contract

### Artifact C — Runtime and release contract

Owner:

- Team 3

Must publish:

- auth, cookie, issuer, and environment scope under `*.omdala.com`
- API/service contract baseline and shared type boundaries
- release checklist, smoke matrix, and rollback notes

Feeds:

- Team 1 canonical and SEO validation
- Team 2 redirect logic, guards, and session UX

## 7. Execution phases

### Phase 1 — Scope cleanup and planning lock

Target:

- freeze the repo into OMDALA-only planning and remove stale drift

Team 1:

- audit homepage and docs copy
- remove stale external-domain language from public content
- publish the naming and metadata matrix

Team 2:

- audit `app`, `auth`, and `admin` route labels
- remove stale UI labels or route assumptions
- publish route and session inventory

Team 3:

- audit env, domain, issuer, and cookie scope
- clean legacy deployment assumptions from scripts and release docs
- publish the runtime and release contract

### Phase 2 — Surface completion

Target:

- align public, product, and backend authority into one coherent platform

Team 1:

- finalize homepage positioning and docs IA
- verify metadata, sitemap, robots, schema, and OG defaults
- align public CTA targets with Team 2 route authority

Team 2:

- finish auth entry and redirect flows
- align dashboard, settings, and admin surface copy
- clean shared UI components that still encode legacy assumptions
- lock final product-facing labels only after Team 1 naming and CTA authority handoff
- lock redirect and guard behavior only after Team 3 auth/session/runtime contract handoff

Team 3:

- freeze auth/session contract
- align shared packages and service labels
- validate deploy-safe defaults for API and service configuration

### Phase 3 — Release readiness

Target:

- move from coherent architecture to repeatable release

Team 1:

- verify public pages and docs are brand-clean
- approve final public copy and metadata evidence

Team 2:

- verify product routes, auth flows, and admin entry points
- approve interface readiness evidence

Team 3:

- run build, typecheck, smoke, and release verification
- capture known blockers such as DNS or credentials
- own go/no-go release decision with evidence from all teams

## 8. Sprint breakdown

### Sprint 1 — Cleanup and authority

- Team 1 locks naming, homepage, docs copy, and SEO rules
- Team 2 locks route map, redirect matrix, and shared UI ownership
- Team 3 locks runtime contract, release checklist, and blocker register

### Sprint 2 — Integrated implementation

- Team 1 finishes public and docs polish
- Team 2 finishes app/auth/admin coherence
- Team 3 finishes contract, env, and deploy safety work

### Sprint 3 — Verification and live release

- Team 1 signs off public brand consistency
- Team 2 signs off product flow consistency
- Team 3 runs release gate and publishes release evidence
- Team 2 cannot self-close Sprint 3 tasks until evidence pass is delivered to Team 3

## 9. Release gate

Release is allowed only when all three teams sign off:

- Team 1: public copy, docs, metadata, and canonical rules are clean
- Team 2: app, auth, admin, and shared UI routes are coherent
- Team 3: contracts, deploy flow, smoke checks, and rollback notes are ready
- Team 2 sign-off is valid only after Team 1 naming/CTA authority and Team 3 runtime contract are acknowledged as inputs

## 10. Definition of done

The OMDALA team is done when:

- public OMDALA copy stands on its own
- product surfaces read as one platform and not a stitched set of legacy flows
- repo docs no longer contain stale mixed-scope references
- contracts build and typecheck cleanly
- release flow is documented, testable, and owned by Team 3 with evidence from Team 1 and Team 2

## 11. Founder directive

From this point forward, OMDALA runs with three aligned dev teams:

- Team 1 protects brand, web, docs, and SEO
- Team 2 protects app, auth, admin, and shared interface quality
- Team 3 protects contracts, services, QA, release, and operational safety

Execution detail lives in:

- `OMDALA_3_TEAM_DELIVERY_BACKLOG_2026-04-19.md`
- `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md`
- `OMDALA_IMPLEMENTATION_CHECKLIST_BY_SURFACE_2026-04-19.md`
- `OMDALA_EXECUTION_BOARD_SPRINTS_2026-04-19.md`
- `OMDALA_3_TEAM_PROGRESS_TRACKER_2026-04-19.md`
