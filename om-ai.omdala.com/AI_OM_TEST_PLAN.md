# AI_OM_TEST_PLAN.md

Version: 2.0  
Status: Locked Om AI test plan  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Date: April 9, 2026

---

# 0. Boundary Normalization - April 9, 2026

This test plan is normalized to the current Om AI boundary.

- `Om AI` is not `OmCode`
- `Om AI` is not `Omniverse`
- the primary test target is the AI human interaction product
- older test ideas tied to rooms, scenes, gateways, proofs, or direct physical execution are now `legacy-transition` or `bridge-only`

---

# 1. Purpose

This file defines how Om AI should be validated before release.

The primary test goal is:

verify Om AI is safe, stable, understandable, and valuable as a live AI human calling product.

---

# 2. Release-Critical Product Areas

The release-critical product areas are:

- persona selection
- session creation
- realtime connection
- voice conversation
- avatar fallback
- usage metering
- recap generation
- memory persistence behavior
- family-safe restrictions
- subscription and billing visibility

---

# 3. Test Layers

## 3.1 Unit Tests

Must cover:

- persona schema parsing and validation
- provider route selection logic
- usage metering calculations
- free-minute warning thresholds
- recap summarization formatting logic
- family-safe entitlement and policy checks
- account/profile/preferences mapping where Om AI consumes shared fields

## 3.2 Integration Tests

Must cover:

- create session -> realtime bootstrap -> active session flow
- end session -> recap payload flow
- usage fetch and plan visibility flow
- account/profile and preferences fetch behavior
- avatar provider unavailable -> voice-only fallback
- reconnect flow after transient realtime interruption
- moderation or policy block response handling

## 3.3 End-to-End Tests

Must cover:

- user starts a teacher call and receives recap
- user starts a language partner call and receives usage updates
- user reaches low-time warning on free plan
- user hits free limit and receives graceful soft landing
- parent-restricted profile cannot enter blocked persona class
- premium user sees upgraded entitlements correctly

## 3.4 Manual Exploratory Tests

Must cover:

- conversation quality
- understandable failure states
- audio route clarity
- reconnect confidence
- recap usefulness
- memory control clarity
- safe mode visibility

---

# 4. Core Scenarios

## 4.1 English Teacher Scenario

Expected:

- persona loads correctly
- call starts successfully
- corrections or lesson prompts appear as designed
- session ends with recap and next-step suggestion

## 4.2 Language Partner Scenario

Expected:

- low-friction conversation start
- free-flow speaking
- usage visibility stays accurate
- fallback remains clear if avatar degrades

## 4.3 Gentle Listener Scenario

Expected:

- supportive tone
- safety-sensitive handling remains bounded
- recap does not become creepy or over-invasive

## 4.4 Free Plan Scenario

Expected:

- 5-minute warning
- 1-minute warning
- graceful completion of current sentence
- upgrade prompt after limit without abrupt cut-off

## 4.5 Family Restriction Scenario

Expected:

- blocked personas remain blocked
- child-safe surfaces remain visible
- policy messaging is understandable

---

# 5. Non-Functional Checks

Must validate:

- acceptable session startup latency
- acceptable reconnect behavior
- acceptable recap latency
- stable fallback when provider quality drops
- acceptable crash-free call experience
- usage accuracy across repeated sessions

---

# 6. Shared Platform Dependency Checks

Because Om AI now depends partially on shared platform surfaces, test coverage must include:

- account/profile fetch success
- preferences fetch success
- billing subscription visibility success
- billing usage visibility success
- graceful Om AI behavior if shared dependency is degraded

Om AI must remain understandable even when shared platform data is delayed or partially unavailable.

---

# 7. Safety and Moderation Checks

Must validate:

- blocked unsafe requests are intercepted
- escalation flows are understandable
- wellness modes do not impersonate licensed clinical care
- family-safe restrictions apply consistently
- provider failures do not bypass product safety rules

---

# 8. Legacy Transition Coverage

Historical reality or physical-control tests may remain only as:

- non-blocking bridge verification
- migration safety checks
- cross-product coordination coverage

They are not primary release gates for Om AI.

---

# 9. Exit Criteria

Om AI is ready for release when:

- core personas work end to end
- realtime sessions are stable enough for daily use
- usage and plan surfaces are accurate
- recap is consistently generated
- family-safe restrictions are reliable
- major fallback states are understandable
- no critical regression exists in shared dependency handling

---

# 10. Final Lock

The canonical Om AI test plan is now:

- live-product-first
- voice and recap centered
- family and safety aware
- shared dependency aware
- bridge-only for old reality scope
