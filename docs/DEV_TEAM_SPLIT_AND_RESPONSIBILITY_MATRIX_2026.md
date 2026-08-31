# DEV_TEAM_SPLIT_AND_RESPONSIBILITY_MATRIX_2026

**Version**: 2.0
**Status**: ACTIVE
**Scope**: OMDALA 3-team ownership and accountability matrix
**Date**: April 19, 2026

---

# 1. Operating model

OMDALA now runs with three aligned dev teams:

- Team 1: Brand, Web, Docs, and SEO
- Team 2: Product Surfaces and Shared UI
- Team 3: Platform Core, API, QA, and Release

This matrix replaces older split-team planning that grouped work by product branch instead of execution responsibility.

---

# 2. Team ownership summary

## Team 1 — Brand, Web, Docs, and SEO

**Primary ownership**

- `apps/web`
- `apps/docs`
- `packages/seo`
- public content system
- site information architecture
- metadata, canonical, schema, sitemap, robots, and OG defaults

**Primary accountability**

- brand consistency
- public naming authority
- docs discoverability
- entry CTA clarity
- SEO correctness

## Team 2 — Product Surfaces and Shared UI

**Primary ownership**

- `apps/app`
- `apps/auth`
- `apps/admin`
- `packages/ui`
- surface route inventory
- product-facing labels and interaction patterns

**Primary accountability**

- route authority
- session and redirect UX
- dashboard, onboarding, and settings coherence
- admin surface clarity
- shared UI stability

## Team 3 — Platform Core, API, QA, and Release

**Primary ownership**

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
- release verification and rollback readiness

**Primary accountability**

- contract integrity
- auth, cookie, and issuer scope
- runtime naming and environment safety
- smoke and release gates
- production blocker ownership

---

# 3. Ownership matrix by surface

| Surface / System | Team 1 | Team 2 | Team 3 |
| --- | --- | --- | --- |
| `omdala.com` public web | DRI | Consulted | Consulted |
| `docs.omdala.com` docs | DRI | Consulted | Consulted |
| `app.omdala.com` app | Consulted | DRI | Consulted |
| `auth.omdala.com` auth | Consulted | DRI | DRI for runtime/auth contract |
| `admin.omdala.com` admin | Consulted | DRI | Consulted |
| `api.omdala.com` API | Informed | Consulted | DRI |
| `packages/seo` | DRI | Informed | Consulted |
| `packages/ui` | Consulted | DRI | Consulted |
| `packages/core` | Informed | Consulted | DRI |
| `packages/types` | Informed | Consulted | DRI |
| deploy scripts and smoke scripts | Informed | Informed | DRI |
| release evidence | Sign-off | Sign-off | DRI |

---

# 4. Decision authority

## Team 1 decides

- public naming and copy
- public route hierarchy
- docs structure and terminology
- SEO defaults and canonical rules

## Team 2 decides

- product route map
- session entry UX
- shared UI usage patterns
- app, auth, and admin interface states

## Team 3 decides

- API and service contracts
- auth/session runtime behavior
- env naming and domain scope
- release and rollback procedures

---

# 5. Mandatory handoffs

## Team 1 to Team 2

- naming matrix
- CTA destination rules
- approved public terminology

## Team 1 to Team 3

- canonical domain rules
- metadata and crawler assumptions
- public release approval notes

## Team 2 to Team 1

- route inventory
- auth entry and redirect matrix
- protected route authority

## Team 2 to Team 3

- interface assumptions tied to session state
- redirect behavior tied to auth contract
- shared UI dependencies that affect runtime

## Team 3 to Team 1

- domain and environment inventory
- canonical runtime scope for subdomains
- release-ready constraints for public deployment

## Team 3 to Team 2

- auth, cookie, issuer, and session contract
- API contract and shared type boundary
- release-safe constraints for app/auth/admin

---

# 6. Conflict resolution

When two teams touch the same system:

1. Team with DRI ownership decides within its area.
2. Team 3 has veto authority on runtime, auth, contract, or release risk.
3. Team 1 has veto authority on public naming and canonical SEO rules.
4. Team 2 has veto authority on route coherence and shared UI behavior inside product surfaces.

---

# 7. Release sign-off

Release is blocked unless:

- Team 1 signs off public and docs readiness
- Team 2 signs off app, auth, and admin readiness
- Team 3 signs off runtime, verification, and rollback readiness

---

# 8. Final rule

No team may restore mixed-brand planning, stale external-domain assumptions, or conflicting ownership structures after this matrix is active.
