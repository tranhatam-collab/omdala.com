# TRUST_ENGINE_OMDALA

## OMDALA
## Trust Engine Specification
## Version 1.0

---

## 1. Purpose

The trust engine exists to make coordination safer, more legible, and more repeatable.

It must affect:

- discoverability
- eligibility
- risk review
- confidence during matching and action

---

## 2. Core principle

Trust is not a single vanity score.

It is a multi-dimensional system built from:

- verification
- behavior
- completion
- proof
- governance
- economic reliability

---

## 3. Trust dimensions

- `identity_trust`
- `behavior_trust`
- `completion_trust`
- `economic_trust`
- `collaboration_trust`
- `governance_trust`

Each subject should expose both an overall score and dimension-specific scores.

---

## 4. Evidence sources

Approved trust sources:

- email or auth verification
- phone or account verification
- ownership or affiliation checks
- payment verification
- proof uploads
- successful completion events
- endorsements attached to real outcomes
- dispute and resolution history
- moderator actions

---

## 5. Trust levels

- `unverified`
- `basic`
- `verified`
- `established`
- `high_trust`
- `network_anchor`

Levels must be explainable in UI and backed by actual state, not arbitrary labels.

---

## 6. Trust events

Every trust-affecting action should emit a `TrustEvent`.

Minimum fields:

- subject
- actor if present
- event type
- event weight
- source
- evidence link if available
- timestamp

---

## 7. Scoring rules

Trust should increase when:

- identity is verified
- actions complete successfully
- proof is added and confirmed
- behavior is consistent
- disputes remain low

Trust should decrease or trigger review when:

- cancellations become excessive
- proofs are rejected
- disputes repeat
- moderation flags accumulate

---

## 8. Explainability

Users should be able to see:

- current trust level
- strongest positive signals
- strongest blockers
- next actions that improve trust

Silent manipulation is not allowed.

---

## 9. Overrides and moderation

Admin overrides must:

- require a reason
- write an audit log
- remain reviewable

Trust must never become an opaque black box.

---

## 10. Final rule

If a trust change affects visibility, opportunity, or money, it must be traceable to evidence.
