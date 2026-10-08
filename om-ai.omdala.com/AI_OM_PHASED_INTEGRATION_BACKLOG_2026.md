# AI_OM_PHASED_INTEGRATION_BACKLOG_2026.md

Version: 1.0  
Status: Locked phased integration backlog  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Date: April 9, 2026  
Owner: Team Om AI

---

# 1. Purpose

This file converts ecosystem audit and dependency decisions into a phased backlog the team can execute without guesswork.

It exists to answer:

- what to integrate now
- what to integrate later
- what must stay optional
- what must never block Om AI core delivery

---

# 2. Core Rule

No external or shared integration may block Om AI core product delivery unless explicitly approved.

Core product delivery means:

- persona browsing
- live sessions
- realtime connection
- usage metering
- recap
- memory controls
- family-safe restrictions
- subscription visibility

---

# 3. Phase 0 — Boundary and Contract Lock

Objectives:

- normalize legacy docs
- lock Om AI versus shared platform boundaries
- lock dependency status
- lock repo structure and implementation order

Backlog:

- maintain `AI_OM_SHARED_PLATFORM_DEPENDENCY_STATUS_2026.md`
- maintain `AI_OM_TEAM_BOUNDARY_AND_DEPENDENCY_MATRIX_2026.md`
- finish legacy cleanup batches
- keep root handoff docs aligned

Status:

- in active execution

---

# 4. Phase 1 — Shared Platform Alignment

Objectives:

- align Om AI with shared baseline account and billing surfaces
- avoid duplicate account and billing work

Backlog:

- consume shared `account/profile`
- consume shared `account/preferences`
- consume shared `billing/subscriptions`
- consume shared `billing/usage`
- map Om AI product behavior on top of those contracts
- document graceful degradation if shared data is stale or unavailable

Rules:

- Om AI does not surrender session, persona, recap, or metering ownership

---

# 5. Phase 2 — Om AI Core MVP Completion

Objectives:

- finish Om AI product core independently of later ecosystem bridges

Backlog:

- `/v2/live` backend routes
- realtime bootstrap path
- iOS call shell
- Android call shell
- voice-only fallback
- recap and memory product behavior
- family-safe restrictions
- subscription prompts and plan-aware gating

Rules:

- this phase must be completable even if CIOS and Flow are untouched

---

# 6. Phase 3 — Shared Package and UX Reuse

Objectives:

- reuse stable shared assets after Om AI core is real

Backlog:

- review shared type extraction opportunities
- review shared UI primitive reuse
- review shared admin IA patterns
- align terminology between Om AI and shared platform

Rules:

- only reuse assets that reduce maintenance cost
- do not replatform Om AI around another product's UX assumptions

---

# 7. Phase 4 — CIOS Bridge

Objectives:

- connect Om AI Business and Enterprise paths to stronger org and CRM concepts

Backlog:

- auth sync review
- workspace sync review
- CRM context injection review
- audit and retention coordination review
- org admin policy bridge review

Rules:

- adapter-based only
- no tight codebase coupling in early phases

---

# 8. Phase 5 — Flow Bridge

Objectives:

- add automation and orchestration after Om AI core and business flows are stable

Backlog:

- recap follow-up automation
- lesson reminder workflows
- scheduled coaching flows
- enterprise follow-up orchestration

Rules:

- Flow remains optional
- Om AI call loop must work without Flow

---

# 9. Integration Status Labels

Use the following labels in backlog tracking:

- `CORE_OWNED`
- `PARTIAL_SHARED`
- `PLANNED_BRIDGE`
- `REFERENCE_ONLY`
- `LEGACY_TRANSITION`

These labels help prevent ownership confusion.

---

# 10. Non-Blocking Rule

The following must not block Om AI core shipping:

- CIOS bridge
- Flow bridge
- docs.iai.one pattern reuse
- gateway-heavy bridge experiments
- any unverified public runtime dependency

---

# 11. Final Lock

The canonical Om AI phased integration order is:

1. boundary and contract lock
2. shared platform alignment
3. Om AI core MVP completion
4. selective shared package reuse
5. CIOS bridge
6. Flow bridge

This order protects execution speed and keeps Om AI ownership intact.
