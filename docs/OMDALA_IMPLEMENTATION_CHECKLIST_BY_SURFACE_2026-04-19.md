# OMDALA Implementation Checklist By Surface

Use this document with:

- `OMDALA_DEV_TEAM_EXECUTION_PLAN_2026-04-17.md`
- `OMDALA_3_TEAM_DELIVERY_BACKLOG_2026-04-19.md`
- `DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026.md`

Purpose:

- convert team planning into surface-by-surface execution
- make ownership, dependency, and acceptance gates explicit
- help the three dev teams parallelize without stepping on each other

## 1. `apps/web` — `omdala.com`

**DRI**: Team 1

**Support**

- Team 2 for CTA destinations and product route targets
- Team 3 for canonical domain/runtime constraints

### Checklist

- lock hero, value proposition, and CTA hierarchy
- audit all public copy for OMDALA-only naming
- audit header, footer, and global navigation
- align metadata, canonical, OG, robots, sitemap, and schema
- verify links to `docs`, `app`, `auth`, and `admin` use current route authority
- verify social preview copy and image references

### Acceptance gate

- public copy is brand-clean
- every CTA points to the intended OMDALA route
- metadata output matches Team 3 domain contract

## 2. `apps/docs` — `docs.omdala.com`

**DRI**: Team 1

**Support**

- Team 2 for product route references inside docs
- Team 3 for API/auth/runtime documentation constraints

### Checklist

- lock docs information architecture
- align section names with current platform vocabulary
- remove legacy or stale implementation assumptions
- verify app/auth/admin/API links and examples
- align docs metadata and discoverability
- identify which docs are canonical versus historical

### Acceptance gate

- docs structure matches current platform scope
- docs no longer route users through stale flows
- source-of-truth pages are easy to identify

## 3. `apps/app` — `app.omdala.com`

**DRI**: Team 2

**Support**

- Team 1 for labels and user-facing naming
- Team 3 for session/runtime/API contract

### Checklist

- publish route inventory
- audit onboarding, dashboard, settings, and core workspace flows
- align empty states, loading states, and error states
- verify protected routes and redirect behavior
- remove stale terminology in product-facing UI
- verify calls into shared UI and shared types

### Acceptance gate

- route authority is documented
- session behavior is coherent under failure and recovery
- user-facing naming matches Team 1 approvals
- final label lock happens only after Team 1 confirms naming and CTA authority
- redirect and guard lock happens only after Team 3 confirms auth/session/runtime contract

## 4. `apps/auth` — `auth.omdala.com`

**DRI**: Team 2

**Support**

- Team 1 for copy tone and naming
- Team 3 for auth/session/cookie/issuer contract

### Checklist

- audit sign-in, sign-up, password reset, invite, and session recovery flows
- publish redirect matrix for all auth states
- verify callback and post-auth destinations
- verify auth copy for OMDALA-only branding
- align auth UI with shared component standards

### Acceptance gate

- every auth state has a defined redirect target
- auth UI reflects runtime truth from Team 3
- no stale domain or cookie assumptions remain in surface logic
- Team 2 does not finalize redirect matrix before Team 3 runtime contract freeze

## 5. `apps/admin` — `admin.omdala.com`

**DRI**: Team 2

**Support**

- Team 1 for terminology and moderation copy
- Team 3 for permission, role, and audit constraints

### Checklist

- define admin navigation and role-based sections
- align moderation, operations, and audit labels
- verify protected admin entry and fallback states
- audit empty states and error states for clarity
- verify dependencies on shared UI and backend permissions

### Acceptance gate

- admin IA matches current operator roles
- guard states and permission messaging are coherent
- no ambiguous ownership between admin and app surfaces
- Team 2 product-facing labels in admin are finalized only after Team 1 naming/CTA handoff

## 6. `services/api` and shared services

**DRI**: Team 3

**Support**

- Team 1 for public-facing labels when exposed in docs
- Team 2 for surface-level usage assumptions

### Checklist

- publish API contract baseline
- audit service naming and runtime labels
- audit auth/session dependencies across services
- verify versioning, environment defaults, and route scope
- align shared types with service output
- identify any legacy external-domain assumption in runtime config

### Acceptance gate

- contracts are typed and stable
- route and env scope are OMDALA-only
- frontend teams have a clear contract to build against

## 7. `packages/ui`

**DRI**: Team 2

**Support**

- Team 1 for naming-sensitive components
- Team 3 for runtime-sensitive UI states

### Checklist

- inventory shared components in active use
- remove stale labels or legacy component variants
- define which components are public-only vs product-only
- align auth and protected-route states with runtime contract
- document components that should not encode route logic

### Acceptance gate

- shared UI is reusable without leaking stale assumptions
- teams know which layer owns copy and which layer owns behavior
- Team 2 does not mark Sprint 3 complete until evidence pass is submitted to Team 3 release gate

## 8. `packages/seo`

**DRI**: Team 1

**Support**

- Team 3 for domain and deployment constraints

### Checklist

- audit metadata defaults
- align canonical host rules
- verify sitemap and robots generation assumptions
- verify structured data defaults

### Acceptance gate

- SEO package encodes current OMDALA rules only

## 9. `packages/core` and `packages/types`

**DRI**: Team 3

**Support**

- Team 2 for consumer expectations

### Checklist

- define shared contract boundary
- remove stale or ambiguous names
- verify types consumed by app/auth/admin
- document which contracts are stable and which are internal

### Acceptance gate

- shared packages expose clear, current OMDALA contracts

## 10. `scripts/*`, verification, and release

**DRI**: Team 3

**Support**

- Team 1 and Team 2 for sign-off evidence

### Checklist

- audit build, deploy, smoke, and release scripts
- publish release checklist with named owners
- capture DNS, credential, or access blockers explicitly
- define rollback path and required evidence
- verify which checks are mandatory before preview and production

### Acceptance gate

- release path is explicit
- blockers are visible and owned
- verification is repeatable

## 11. Parallelization rules

- Team 1 can work `apps/web`, `apps/docs`, and `packages/seo` in parallel after Team 2 shares route targets.
- Team 2 can work `apps/app`, `apps/auth`, `apps/admin`, and `packages/ui` in parallel after Team 3 shares auth/session/runtime constraints.
- Team 3 can work services, shared contracts, and release verification in parallel, but must publish contract changes before Team 2 locks redirect or session behavior.

## 12. Final delivery rule

No surface is considered complete until its DRI team signs the acceptance gate and the dependent teams confirm that the surface no longer creates downstream ambiguity.
For Team 2 surfaces, this includes Team 1 naming/CTA authority, Team 3 runtime contract, and evidence pass handoff to Team 3 before Sprint 3 closeout.
