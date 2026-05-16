# OMDALA DATABASE SCHEMA FULL 2026

## 1. Purpose

Define the production schema baseline for the OMDALA reality core and map it to the backend architecture.

---

## 2. Canonical Locations

- `infra/db/schema.sql`
- `infra/migrations/0001_reality_core.up.sql`
- `infra/migrations/0001_reality_core.down.sql`

---

## 3. Core Tables

- `nodes`
- `states`
- `commitments`
- `transitions`
- `proofs`
- `trust_scores`
- `trust_score_history`
- `events`
- `policy_decisions`

---

## 4. Design Rules

- canonical state lives in PostgreSQL
- events are append-only
- trust updates are auditable
- proof binaries are stored outside relational hot paths

---

## 5. Status Enums (constraint-based)

Key constrained statuses include:

- commitment: `draft`, `pending_approval`, `active`, `completed`, `failed`, `disputed`
- transition: `planned`, `in_progress`, `completed`, `failed`
- proof verification: `not_started`, `pending`, `verified`
- trust level: `unverified`, `basic`, `verified`, `established`, `trusted`

---

## 6. Event Types (initial)

- `commitment.created`
- `commitment.accepted`
- `commitment.completed`
- `proof.submitted`
- `proof.verified`
- `trust.updated`

---

## 7. Next Actions

1. Wire `services/api` to real persistence instead of in-memory seed.
2. Add repository-layer helpers for commitments/proofs/trust.
3. Add migration runner script for CI and staging promotion.
