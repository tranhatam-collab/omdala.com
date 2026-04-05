# Om AI Test Plan

Version: 1.0
Status: Draft for DEV handoff

## 1. Goal

Verify Om AI is safe, reliable, and proof-backed before scale.

## 2. Test Layers

### 2.1 Unit Tests

- grammar parsing
- policy evaluation
- memory updates
- proof creation

### 2.2 Integration Tests

- planner to execution
- execution to proof
- gateway to backend sync
- iOS to API flow

### 2.3 Scenario Tests

- room sleep scene
- morning routine
- guest mode
- sensitive approval flow
- offline gateway recovery

### 2.4 Device Tests

- HomeKit supported devices
- Matter devices
- BLE accessories
- local IP devices via gateway

### 2.5 Safety Tests

- denied action path
- approval required path
- two-person approval path
- failure rollback path

## 3. Must-Pass Scenarios

1. Voice command executes correct scene.
2. Sensitive action requires confirmation.
3. Proof is generated for all actions.
4. Gateway offline behavior is safe.
5. Unsupported device is rejected safely.
