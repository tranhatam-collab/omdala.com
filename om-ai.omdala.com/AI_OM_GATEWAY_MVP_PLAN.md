# Om AI Gateway MVP Plan

Version: 1.0
Status: Draft for DEV handoff

## 1. Goal

Ship the first local bridging runtime for devices not covered by native Apple Home / Matter.

## 2. MVP Promise

The gateway must discover local devices, execute actions, report state, buffer proof, and survive offline periods safely.

## 3. MVP Modules

### 3.1 Discovery

- local device discovery
- capability enumeration

### 3.2 Execution

- command relay
- retries
- reconnects

### 3.3 Sync

- state sync to backend
- proof forwarding

### 3.4 Health

- heartbeat
- uptime
- queue depth

## 4. Supported Targets

- local IP devices
- BLE devices
- legacy hubs
- vendor APIs with local relay needs

## 5. MVP Acceptance Criteria

1. Gateway registers successfully.
2. Gateway reports heartbeat.
3. Gateway executes a supported command.
4. Gateway reports observed state.
5. Gateway buffers proof while offline and syncs later.
