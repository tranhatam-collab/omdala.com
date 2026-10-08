# AI_OM_SHARED_RESOURCE_REUSE_PLAN_2026.md

Version: 1.0  
Status: Locked shared resource reuse plan  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Date: April 9, 2026  
Owner: Team Om AI

---

# 1. Purpose

This file defines which existing ecosystem resources Om AI should reuse, when to reuse them, and how to reuse them without losing product ownership.

It exists to stop:

- duplicate platform work
- accidental ownership drift
- copy-paste architecture drift
- premature hard dependencies on systems that should stay optional

---

# 2. Core Rule

Reuse shared assets where they reduce duplicated effort.  
Do not reuse them in a way that makes Om AI lose control of its own product logic.

Canonical rule:

- reuse by contract alignment first
- reuse by package extraction second
- reuse by adapter integration third
- avoid direct code copy where possible

---

# 3. Reuse Priority Tiers

## 3.1 Tier 1 — Reuse Now

The following resources are the strongest immediate reuse candidates:

- shared account/profile baseline from `omdala.com`
- shared account/preferences baseline from `omdala.com`
- shared billing/subscriptions baseline from `omdala.com`
- shared billing/usage baseline from `omdala.com`
- common API envelope patterns
- shared naming conventions for user, workspace, plan, and request metadata

Reason:

- these areas already show real implementation progress
- they reduce duplicate account and billing work
- they do not require Om AI to surrender live product ownership

## 3.2 Tier 2 — Reuse After MVP Core Is Stable

These resources should be reused after Om AI core session flows are stable:

- selected shared UI primitives and design patterns
- auth and session conventions
- notification patterns
- trust and audit conventions where relevant
- selected admin information architecture patterns from `omdala.com`

Reason:

- useful leverage
- lower risk once Om AI core product boundaries are locked

## 3.3 Tier 3 — Reuse in Later Integration Phases

These should be reused only in later phases:

- CIOS org policy and CRM-context patterns
- CIOS audit and retention coordination patterns
- Flow automation patterns for recap follow-up and scheduled orchestration
- docs.iai.one documentation architecture patterns

Reason:

- valuable, but not required for Om AI MVP
- better introduced through adapters after product core is stable

---

# 4. Recommended Reuse Sources

## 4.1 `omdala.com`

Reuse priority: highest

Recommended reuse:

- shared account and profile baseline
- shared preferences baseline
- shared billing baseline
- shared naming conventions
- selected app and admin IA patterns

Not to reuse blindly:

- assumptions that all products share identical user-facing semantics

## 4.2 `cios.iai.one`

Reuse priority: medium later

Recommended reuse later:

- enterprise workspace concepts
- CRM context injection patterns
- audit and compliance coordination
- business admin patterns

Not to reuse early:

- business-heavy workflows as Om AI MVP dependency

## 4.3 `flow.iai.one`

Reuse priority: medium later

Recommended reuse later:

- scheduled recap automation
- follow-up workflows
- orchestration helpers

Not to reuse early:

- workflow runtime as a hard dependency for Om AI call MVP

## 4.4 `docs.iai.one`

Reuse priority: reference only

Recommended reuse:

- docs hub structure
- documentation navigation patterns

---

# 5. What Om AI Must Not Reuse Too Early

Do not pull these into Om AI as early dependencies:

- OmCode product assumptions
- Omniverse device-control-first assumptions
- gateway-heavy runtime assumptions
- workflow-engine-first architecture
- public runtime surfaces that are not verified stable

Doing so would slow Om AI and blur ownership.

---

# 6. Reuse Methods

Approved methods:

1. Contract alignment
2. Typed client reuse
3. Shared package extraction
4. Adapter-based integration
5. Information architecture reference

Discouraged methods:

- copy-paste code drift
- hidden implicit dependencies
- merging unrelated runtime concerns into Om AI core

---

# 7. Ownership Protection Rules

Even when Om AI reuses shared resources, Om AI still owns:

- personas
- live sessions
- realtime bootstrap behavior
- provider routing
- usage metering behavior
- recap behavior
- memory behavior
- family, school, and business mode semantics

Shared reuse does not change that ownership.

---

# 8. Immediate Reuse Recommendations

Use now:

- shared account/profile dependency status
- shared preferences dependency status
- shared billing visibility dependency status
- common request and response vocabulary

Prepare next:

- shared type extraction review
- shared plan naming alignment
- shared app shell terminology alignment

Wait until later:

- CIOS bridge
- Flow bridge
- broader ecosystem connectors

---

# 9. Final Lock

The canonical Om AI reuse strategy is:

- aggressive on shared platform basics
- careful on business and orchestration bridges
- strict on product ownership
- adapter-based for anything non-core
