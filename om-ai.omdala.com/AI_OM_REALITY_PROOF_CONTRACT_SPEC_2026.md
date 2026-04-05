# Om AI Reality Proof Contract Spec 2026

## Purpose

Define the proof record created after each real-world execution.

## Required Fields

- proof_id
- action_id
- actor_id
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

## Proof Sources

- native framework state readback
- connector callback
- gateway verification
- device telemetry
- user confirmation

## Requirements

- proof must be immutable once written
- proof must be queryable by actor, space, device, and time
- failed verification must be recorded, not hidden
