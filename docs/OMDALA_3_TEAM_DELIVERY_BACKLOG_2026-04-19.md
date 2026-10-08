# OMDALA 3-Team Delivery Backlog

Use this document with `OMDALA_DEV_TEAM_EXECUTION_PLAN_2026-04-17.md`.

Purpose:

- turn the three-team model into direct execution work
- define what each team does now, next, and before release
- make dependencies visible before implementation starts

Scope:

- `OMDALA` only

## 1. Shared operating cadence

All three teams work in one release rhythm:

- daily 20-minute dependency sync with one blocker owner per issue
- twice-weekly architecture and contract review led by Team 3
- twice-weekly surface and copy review led by Team 1 and Team 2
- end-of-week release readiness review with evidence from all three teams

Required shared outputs each week:

- one updated blocker register
- one updated dependency board
- one updated release evidence snapshot

## 2. Team 1 backlog — Brand, Web, Docs, and SEO

Owns:

- `apps/web`
- `apps/docs`
- `packages/seo`

### Priority 0 — Do now

1. Lock the canonical naming matrix for `OMDALA`, `Om AI`, and `AI Omniverse`.
2. Audit every homepage, docs, and footer mention that can still imply external brand coupling.
3. Finalize homepage positioning, CTA targets, and public information hierarchy.
4. Finalize docs landing structure, section naming, and cross-link logic.
5. Align `title`, `description`, canonical, OG, schema, sitemap, and robots outputs.

### Priority 1 — Do before preview sign-off

1. Audit public visual assets, screenshots, and social preview assets for stale naming.
2. Align docs and web empty states, trust language, and platform descriptions.
3. Publish the public content approval checklist for Team 2 and Team 3 consumption.

### Exit criteria

- no stale external-domain or mixed-brand wording in owned files
- public and docs surfaces use one naming system
- SEO defaults align with current route authority
- Team 1 can sign off public release readiness without caveats

## 3. Team 2 backlog — Product Surfaces and Shared UI

Owns:

- `apps/app`
- `apps/auth`
- `apps/admin`
- `packages/ui`

### Priority 0 — Do now

1. Publish the route inventory for `app`, `auth`, and `admin`.
2. Publish the redirect matrix for sign-in, sign-out, password reset, session expiry, and protected routes.
3. Audit shared UI components for stale labels, permission assumptions, or legacy product wording.
4. Lock the dashboard, settings, onboarding, and admin IA to current OMDALA scope.
5. Align route labels and entry points with Team 1 naming rules.
6. Treat Team 1 naming and CTA authority as a hard dependency before finalizing any product-facing labels.
7. Treat Team 3 auth/session/runtime contract as a hard dependency before finalizing redirect or guard logic.

### Priority 1 — Do before preview sign-off

1. Verify error states, empty states, and session recovery flows.
2. Document UI ownership boundaries between app, auth, admin, and `packages/ui`.
3. Publish interface verification notes for Team 3 release evidence.

### Exit criteria

- route authority is documented and accepted by Team 1 and Team 3
- session flows are coherent and do not depend on non-OMDALA assumptions
- shared UI primitives no longer leak stale naming or route logic
- Team 2 can sign off interface readiness without unresolved redirect ambiguity
- Sprint 3 for Team 2 remains open until evidence pass is delivered to Team 3 and acknowledged for release gating

## 4. Team 3 backlog — Platform Core, API, QA, and Release

Owns:

- `services/*`
- `packages/core`
- `packages/types`
- `infra/*`
- `scripts/*`
- smoke and release verification

### Priority 0 — Do now

1. Publish the domain and environment inventory for every `*.omdala.com` surface.
2. Lock auth, cookie, issuer, and session scope under `*.omdala.com`.
3. Audit API, service, and shared type naming for OMDALA-only correctness.
4. Review deploy scripts, smoke scripts, and release docs for stale assumptions.
5. Build the blocker register for DNS, credentials, Cloudflare access, and release dependencies.

### Priority 1 — Do before preview sign-off

1. Run build and typecheck verification for impacted surfaces.
2. Run smoke checks for web, auth, app, admin, and API paths where environment allows.
3. Publish rollback notes and release owner matrix.
4. Publish release evidence that depends on sign-off from Team 1 and Team 2.

### Exit criteria

- auth and runtime contracts are clear and reusable
- shared packages and service names are consistent
- release verification can be rerun by the team
- every release blocker is documented with owner and next action

## 5. Cross-team dependency map

### Team 1 depends on

- Team 2 route authority for CTA destinations
- Team 3 canonical runtime and domain contract for SEO validation

### Team 2 depends on

- Team 1 naming matrix for route labels and user-facing copy
- Team 3 auth and cookie contract for redirect and session behavior
- Team 1 CTA authority for final route label and entry copy decisions
- Team 3 runtime contract freeze before guard/redirect closeout

### Team 3 depends on

- Team 1 public naming approval for env, release, and service labeling
- Team 2 route and session map for auth, guards, and smoke verification

## 6. Release sequence

### Step 1

Team 1 publishes naming and public authority.

### Step 2

Team 2 publishes route and session authority.

### Step 3

Team 3 freezes runtime contract and release gate.

### Step 4

All three teams run integrated verification and hand Team 3 the final go/no-go evidence.

## 7. Non-negotiable cleanup rules

- remove stale external-brand references before adding new work
- do not restore mixed-brand docs, routes, or auth assumptions
- do not treat unresolved DNS or credential blockers as completed release work
- do not mark release-ready until all three teams have signed their sections
- do not allow Team 2 to self-close Sprint 3 tasks without evidence pass handed to Team 3
