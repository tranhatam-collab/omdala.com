# Om AI Gateway Runtime Spec

Version: 1.0
Status: Draft for DEV handoff
Product: Om AI
Component: Om Gateway

## 1. Purpose

Define the local gateway runtime that bridges Om AI to devices outside native Apple Home / Matter coverage.

## 2. Role

Om Gateway is the local execution bridge for:

- LAN-only devices
- BLE devices
- legacy hubs
- proprietary device protocols
- vendor APIs that need local resilience

## 3. Gateway Responsibilities

- local discovery
- protocol translation
- execution queue management
- retry logic
- reconnect logic
- offline safe scenes
- state reporting
- proof buffering
- security boundary enforcement
- heartbeat reporting

## 4. Runtime Modes

### 4.1 Software-Only Node

Runs on an always-on local machine.

### 4.2 Mini PC / Mac / Linux Runtime

Runs on dedicated local infrastructure.

### 4.3 Future Dedicated Hardware Node

Reserved for later product expansion.

## 5. Supported Bridge Targets

- local IP APIs
- BLE peripherals
- serial-connected devices
- legacy control hubs
- vendor cloud fallbacks

## 6. Core Runtime Services

### Discovery Service

Finds local devices and publishes capabilities.

### Execution Service

Runs translated actions against local targets.

### Sync Service

Synchronizes local state with OMDALA graph and cloud backend.

### Proof Service

Buffers and forwards proof records.

### Health Service

Reports uptime, reachability, and device health.

## 7. Gateway Registration Fields

- `gateway_id`
- `location`
- `household_or_business_scope`
- `supported_protocols`
- `local_ip`
- `health_status`
- `last_heartbeat`
- `local_capabilities`
- `software_version`

## 8. Safety Requirements

- gateway must never bypass policy
- gateway must honor approval requirements
- gateway must fail safe on partial outage
- gateway must log rejected or incomplete execution

## 9. Observability

- device connection status
- command latency
- retry count
- offline queue length
- execution success rate
- proof upload status
