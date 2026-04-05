# Om AI Proof Schema Spec

Version: 1.0
Status: Draft for DEV handoff

## 1. Purpose

Define the proof object generated after each execution.

## 2. Required Fields

- proof_id
- run_id
- action_id
- actor_id
- space_id
- device_id
- requested_state
- previous_state
- actual_state
- policy_result
- approval_reference
- verification_source
- verified_at
- confidence_score
- rollback_hint

## 3. Proof Sources

- native framework state readback
- gateway report
- connector callback
- telemetry confirmation
- user confirmation

## 4. Proof Rules

- proof must be immutable once written
- failed verification must still be stored
- proof must be queryable by actor, space, device, and time
