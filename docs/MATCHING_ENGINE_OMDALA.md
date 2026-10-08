# MATCHING_ENGINE_OMDALA

## OMDALA
## Matching Engine Specification
## Version 1.0

---

## 1. Purpose

The matching engine converts structured supply, demand, capability, and trust into ranked next-best opportunities.

It is one of the core moats of the platform.

---

## 2. Match types

Supported match families:

- request ↔ offer
- node ↔ node
- node ↔ resource
- expert ↔ project
- host ↔ guest or operator
- community ↔ contributor

The engine must remain platform-level and not depend on any single local implementation.

---

## 3. Input signals

Primary scoring inputs:

- category fit
- trust compatibility
- availability overlap
- capability fit
- location or network proximity when relevant
- budget compatibility
- intent fit
- response probability

Hard filters should run before scoring when obvious incompatibilities exist.

---

## 4. Output contract

Each match result must include:

- score
- match type
- short reason summary
- trust gaps if any
- recommended next action

Matching must be explainable enough for product UI and moderation review.

---

## 5. Status lifecycle

- `suggested`
- `viewed`
- `interested`
- `negotiating`
- `confirmed`
- `completed`
- `dismissed`
- `rejected`

These statuses should be stored explicitly.

---

## 6. Ranking logic

The engine should favor:

- high-fit
- high-trust
- action-likely
- low-friction opportunities

It should not over-optimize for raw recency or vanity engagement.

---

## 7. Learning loop

The engine should improve from:

- accepted matches
- completed matches
- dismissed matches
- repeated counterparties
- post-action proof quality

But it must remain auditable. Learning must not become opaque ranking drift.

---

## 8. Failure handling

When no strong match exists, the system should return:

- reason for low fit
- blockers
- suggested user actions to improve future matching

Returning nothing with no explanation is not acceptable.

---

## 9. Core metrics

- match acceptance rate
- match-to-action conversion
- time-to-first-meaningful-match
- completion rate by match type
- repeat trusted match rate

---

## 10. Final rule

If the engine cannot explain why a match is good, it is not ready to influence high-value action.
