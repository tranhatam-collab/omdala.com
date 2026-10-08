# Om AI Proof Schema Spec

Version: 2.0
Status: Locked Om AI evidence schema for current product scope
Canonical product name: Om AI
Date: April 9, 2026

## Boundary normalization — April 9, 2026

This file is now normalized to current Om AI proof and evidence needs.

Current rule:

- Om AI current proof focus is session, recap, moderation, usage, and policy evidence
- physical execution proof is not current Om AI product core ownership
- any older physical proof fields are historical context only

## 1. Purpose

Define the evidence object Om AI may use for current product flows such as:

- live session lifecycle
- recap generation traceability
- moderation escalation traceability
- usage metering traceability
- family-safe policy enforcement traceability

## 2. Current Evidence Fields

- `evidence_id`
- `session_id`
- `user_id`
- `workspace_id`
- `persona_id`
- `evidence_type`
- `source`
- `summary`
- `policy_result`
- `created_at`
- `confidence_score` where relevant
- `metadata`

## 3. Evidence Types

- `session_started`
- `session_ended`
- `recap_generated`
- `usage_recorded`
- `policy_blocked`
- `moderation_escalated`
- `family_restriction_applied`

## 4. Rules

- evidence records must be immutable once written
- failed or blocked outcomes must still be recorded
- evidence must be queryable by session, user, persona, and time

## 5. Legacy Transition Note

Older physical execution proof objects may remain archived, but they are not current Om AI core proof requirements.

## 6. Final Lock

The canonical Om AI proof schema is now evidence-for-live-product behavior, not physical execution proof.
