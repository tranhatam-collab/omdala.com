# Om AI Device Graph Schema v1

Version: 1.0
Status: Draft for DEV handoff
Product: Om AI

## 1. Purpose

Define the canonical schema for devices, spaces, scenes, policies, approvals, and proofs inside OMDALA Reality OS.

## 2. Design Principles

- graph-first
- policy-aware
- proof-linked
- space-aware
- device-capability aware
- household and business compatible

## 3. Core Nodes

### User

Fields:

- `user_id`
- `display_name`
- `role`
- `permissions[]`
- `preferences`
- `memory_refs[]`

### Space

Fields:

- `space_id`
- `parent_space_id`
- `name`
- `space_type`
- `aliases[]`
- `mode`
- `device_ids[]`
- `policy_ids[]`

### Device

Fields:

- `device_id`
- `space_id`
- `display_name`
- `vendor`
- `model`
- `protocol`
- `onboarding_method`
- `online_state`
- `latency_class`
- `safety_class`
- `approval_policy_id`
- `capability_ids[]`
- `gateway_id`
- `native_binding_ref`
- `cloud_connector_ref`

### Capability

Fields:

- `capability_id`
- `name`
- `type`
- `unit`
- `reportable`
- `controllable`

### Scene

Fields:

- `scene_id`
- `display_name`
- `aliases[]`
- `space_scope`
- `action_templates[]`
- `safety_class`
- `approval_policy_id`

### Policy

Fields:

- `policy_id`
- `scope`
- `action_class`
- `role_constraints[]`
- `safety_class`
- `approval_requirement`
- `time_window`
- `location_requirement`

### Proof

Fields:

- `proof_id`
- `run_id`
- `requested_state`
- `reported_state`
- `confidence`
- `verification_source`
- `timestamp`

## 4. Relationships

- user owns or operates space
- space contains devices
- device exposes capabilities
- scene targets devices or spaces
- policy constrains actions
- approval authorizes a run
- proof links to run and device state

## 5. Required Graph Queries

- devices by space
- devices by capability
- scenes by room
- policies by role
- proofs by device
- approval history by user
- gateway health by scope

## 6. Non-Goals

- raw transport internals as primary graph concepts
- unsupported device pretending to be supported
- losing proof linkage during sync
