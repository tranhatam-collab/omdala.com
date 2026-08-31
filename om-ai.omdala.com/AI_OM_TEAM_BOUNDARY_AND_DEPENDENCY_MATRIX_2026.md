# AI_OM_TEAM_BOUNDARY_AND_DEPENDENCY_MATRIX_2026.md

Version: 1.0  
Status: ACTIVE TEAM OWNERSHIP MATRIX  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Date: April 9, 2026  
Owner: Om AI Team / Shared Platform / Founder handoff

---

# 1. PURPOSE

This file defines:

- who owns what
- what is shared
- what is dependent
- what must not be merged across boundaries

It exists to protect Om AI execution speed while keeping platform alignment.

---

# 2. PRODUCT DISTINCTION LOCK

Before reading any matrix, lock this:

- `Om AI` is an AI human interaction product
- `OmCode` is a different product
- `Omniverse` is a different product

Om AI is not a code product.
Om AI is not a device-control product.

If any old file blurs these lines, this file overrides that ambiguity for execution purposes.

---

# 3. TEAM MAP

## Team A — Om AI Product Team

Primary mission:

- ship Om AI live product

## Team B — Shared Platform Team

Primary mission:

- provide stable cross-product foundations

## Future bridge teams

- CIOS integration
- Flow orchestration integration

These are later-phase collaborators, not current Om AI MVP owners.

---

# 4. OWNERSHIP MATRIX

## 4.1 Om AI Team owns

- personas
- live call/session flows
- realtime bootstrap
- provider routing
- recap
- memory product behavior
- curriculum behavior
- Om AI business/family/school mode logic
- Om AI feature flags and gating
- Om AI metering truth
- Om AI pricing interpretation at product layer

Status for all above:

- `OM_AI_OWNED`

## 4.2 Shared Platform Team owns

- auth/session infrastructure
- account baseline contracts
- preferences baseline contracts
- subscription baseline contracts
- usage baseline contracts
- generic billing rails
- generic API envelope
- generic observability foundation

Status for all above:

- `SHARED_PLATFORM_OWNED`

## 4.3 Partial shared areas

- account/profile
- account/preferences
- billing/subscriptions
- billing/usage

Status:

- `PARTIAL_SHARED`

Interpretation:

- shared platform owns baseline structure
- Om AI owns product-facing usage and behavior

---

# 5. DEPENDENCY MATRIX

## Om AI depends on Shared Platform for

- user identity baseline
- session continuity
- generic billing/subscription records
- generic usage records
- platform-safe API patterns

## Shared Platform depends on Om AI for

- real product requirements
- live call usage semantics
- plan-specific feature gating
- Om AI event naming
- Om AI metering interpretation

This is not a one-way dependency.

---

# 6. WHAT MUST NEVER BE MOVED WITHOUT APPROVAL

The following cannot be moved to shared platform without explicit approval:

- persona registry logic
- provider routing logic
- live-call orchestration logic
- free-minute rule semantics
- recap generation semantics
- memory retention product rules
- curriculum progression semantics
- business/family/school experience logic

These are product-core, not shared-core.

---

# 7. WHAT MAY BE STANDARDIZED LATER

The following may be standardized later if multiple products truly need them:

- usage event envelope
- invoice download patterns
- audit metadata
- notification preferences
- plan catalog format

Current status:

- do not prematurely centralize

---

# 8. CURRENT EXECUTION DECISION

For the current phase:

- `omdala.com` is the shared platform
- `om-ai.omdala.com` is the Om AI product workspace
- `cios.iai.one` is a later enterprise bridge
- `flow.iai.one` is a later orchestration bridge

Om AI team must keep product momentum inside its own workspace.

---

# 9. FAILURE MODES TO AVOID

Do not:

- merge hot Om AI live logic into shared platform
- let shared platform redefine Om AI product scope
- confuse Om AI with OmCode
- shift ownership because a contract is shared
- centralize before product behavior is stable

---

# 10. OPERATIONAL RULE FOR DAILY DEV

When a task appears:

1. decide if it is Om AI product logic or shared platform logic
2. if shared baseline only, Team B may own it
3. if user-facing Om AI behavior changes, Team A owns it
4. if both are involved, mark it `PARTIAL_SHARED` and keep final product semantics with Team A

---

# 11. FINAL DIRECTIVE

Om AI and shared platform must move together, but not collapse into one ownership layer.

Shared platform should make Om AI faster.
It must not make Om AI blurrier.

---

# END OF FILE
