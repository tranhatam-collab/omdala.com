# OMDALA Universal Device Graph Spec 2026

## Purpose

Define the canonical device and space model used by Om AI, OMDALA Reality API, iOS, web, connectors, and Om Gateway.

## Core Entity Model

### Device

Required fields:

- device_id
- space_id
- vendor
- model
- protocol
- connector_id
- safety_class
- latency_class
- online_state
- ownership_state
- approval_policy
- capability_ids
- desired_state_schema
- actual_state_schema
- last_proof_id

### Space

Required fields:

- space_id
- parent_space_id
- name
- mode
- location
- members
- roles
- policy_ids

### Capability

Examples:

- power
- dimming
- temperature control
- lock control
- motion sensing
- presence sensing
- audio input
- audio output
- camera
- blind control

### Policy

Policies define when and how actions may execute.

Required fields:

- policy_id
- scope
- action_class
- actor_role
- safety_class
- approval_requirement
- time_window
- location_requirement

### Proof

Proof is the durable record of execution.

Required fields:

- proof_id
- action_id
- device_id
- previous_state
- requested_state
- actual_state
- verified_at
- verification_source

## Graph Requirements

- graph must support household and business modes
- graph must support room, zone, and nested space relationships
- graph must support device-to-capability mapping
- graph must support policy and approval edges
- graph must support proof history

## Non-Goals

- exposing raw transport internals as the primary UX
- assuming full mesh topology visibility
- representing unsupported devices as native devices without connector metadata
