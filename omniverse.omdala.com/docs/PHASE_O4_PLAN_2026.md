# Phase O4 — Stronger State Graph, Expansion-Ready Device Model, Multi-Property, Observability

**Date:** 2026-04-05
**Branch:** `feat/omniverse-auth-o1-o2`
**Status:** COMPLETE — 33/33 tests passing

---

## Goal

Phase O4 hardens the Omniverse runtime with four production-oriented pillars that make the system observable, auditable, and expansion-ready:

| Pillar                  | Summary                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **State Graph**         | Every device state change is recorded to an append-only event log with before/after JSON, source and actor tracking          |
| **Device Capabilities** | A per-device-type capability registry that validates state updates at the API layer (422 CAPABILITY_VIOLATION on violations) |
| **Multi-Property**      | Properties group one or more workspaces under a single owner; full CRUD via `/v2/omniverse/properties`                       |
| **Observability**       | An append-only event log per workspace; queryable event stream; health summary endpoint; enriched `/health` with uptime      |

---

## New DB Tables

### `omniverse_properties`

Stores property records (homes, offices, etc.) owned by a user.

| Column          | Type         | Notes                                    |
| --------------- | ------------ | ---------------------------------------- |
| `property_id`   | UUID PK      |                                          |
| `owner_user_id` | TEXT         | References auth user ID from shared-core |
| `name`          | TEXT         |                                          |
| `address`       | TEXT         | nullable                                 |
| `type`          | TEXT         | `residential`, `commercial`, etc.        |
| `meta_json`     | JSONB / TEXT | arbitrary metadata                       |
| `created_at`    | TIMESTAMPTZ  |                                          |

### `omniverse_property_workspaces`

Join table linking properties to workspace IDs.

| Column         | Type        | Notes                         |
| -------------- | ----------- | ----------------------------- |
| `property_id`  | UUID FK     | → `omniverse_properties`      |
| `workspace_id` | TEXT        | workspace ID from shared-core |
| `linked_at`    | TIMESTAMPTZ |                               |

### `omniverse_device_capabilities`

Capability registry for device types.

| Column         | Type         | Notes                                 |
| -------------- | ------------ | ------------------------------------- |
| `device_type`  | TEXT         | e.g. `light`, `climate`               |
| `capability`   | TEXT         | e.g. `brightness`, `power`            |
| `value_type`   | TEXT         | `number`, `enum`, `boolean`, `string` |
| `min_value`    | NUMERIC      | for number type                       |
| `max_value`    | NUMERIC      | for number type                       |
| `allowed_json` | JSONB / TEXT | for enum type                         |
| `created_at`   | TIMESTAMPTZ  |                                       |

### `omniverse_state_events`

Append-only record of every device state change.

| Column          | Type         | Notes                                            |
| --------------- | ------------ | ------------------------------------------------ |
| `event_id`      | UUID PK      |                                                  |
| `device_id`     | TEXT         |                                                  |
| `workspace_id`  | TEXT         |                                                  |
| `previous_json` | JSONB / TEXT | state before change                              |
| `new_json`      | JSONB / TEXT | state after change                               |
| `source`        | TEXT         | `manual`, `automation`, `gateway`, `schedule`    |
| `actor_id`      | TEXT         | nullable — user/automation that triggered change |
| `occurred_at`   | TIMESTAMPTZ  |                                                  |

### `omniverse_events`

Append-only observability event log.

| Column         | Type         | Notes                                           |
| -------------- | ------------ | ----------------------------------------------- |
| `event_id`     | UUID PK      |                                                 |
| `workspace_id` | TEXT         |                                                 |
| `event_type`   | TEXT         | e.g. `device.state_updated`, `device.onboarded` |
| `subject_id`   | TEXT         | nullable — device/room/automation ID            |
| `payload_json` | JSONB / TEXT | arbitrary context                               |
| `severity`     | TEXT         | `info`, `warn`, `error`                         |
| `occurred_at`  | TIMESTAMPTZ  |                                                 |

---

## New Services

### `stateGraphService`

- `recordStateChange({ deviceId, workspaceId, previousState, newState, source, actorId })`
- `listDeviceHistory({ deviceId, limit })`
- `listWorkspaceHistory({ workspaceId, limit })`

### `deviceCapabilityService`

- `registerCapability({ deviceType, capability, valueType, minValue, maxValue, allowed })`
- `listCapabilities({ deviceType })`
- `validateStateUpdate(deviceType, statePayload)` — throws `HttpError(422, "CAPABILITY_VIOLATION")` on constraint violations; passes through if no capabilities are registered for the device type

### `propertyService`

- `createProperty({ ownerUserId, name, address, type, meta })`
- `listProperties({ ownerUserId })`
- `getProperty({ propertyId })`
- `addWorkspaceToProperty({ propertyId, workspaceId })`
- `listPropertyWorkspaces({ propertyId })`

### `observabilityService`

- `logEvent({ workspaceId, eventType, subjectId, payload, severity })`
- `queryEvents({ workspaceId, eventType, limit })`
- `getHealthSummary({ workspaceId })` → `{ workspaceId, eventCount, lastEventAt, status }`

---

## deviceService Changes

`updateDeviceState` now runs a 5-step pipeline:

1. Fetch current device state (for diffing)
2. `deviceCapabilityService.validateStateUpdate` — reject violations before write
3. `dbAdapter.updateDeviceState` — persist
4. `stateGraphService.recordStateChange` — emit history event
5. `observabilityService.logEvent` — emit observability event

All three O4 services are optional injections (backward compatible).

---

## New API Endpoints

| Method | Path                                              | Description                    |
| ------ | ------------------------------------------------- | ------------------------------ |
| `POST` | `/v2/omniverse/properties`                        | Create property                |
| `GET`  | `/v2/omniverse/properties?ownerUserId=`           | List properties                |
| `GET`  | `/v2/omniverse/properties/:propertyId`            | Get property                   |
| `POST` | `/v2/omniverse/properties/:propertyId/workspaces` | Link workspace to property     |
| `GET`  | `/v2/omniverse/properties/:propertyId/workspaces` | List property workspaces       |
| `POST` | `/v2/omniverse/device-capabilities`               | Register capability            |
| `GET`  | `/v2/omniverse/device-capabilities?deviceType=`   | List capabilities              |
| `GET`  | `/v2/omniverse/devices/:deviceId/history`         | Device state event history     |
| `GET`  | `/v2/omniverse/workspaces/:workspaceId/history`   | Workspace-wide state events    |
| `GET`  | `/v2/omniverse/workspaces/:workspaceId/events`    | Observability event log        |
| `GET`  | `/v2/omniverse/workspaces/:workspaceId/health`    | Workspace health summary       |
| `GET`  | `/health`                                         | Enriched: `{ status, uptime }` |

---

## Test Coverage

13 new tests added to `backend/src/index.test.js` (total: 33, all passing):

- `O4: POST /properties creates a property`
- `O4: GET /properties lists properties for owner`
- `O4: GET /properties/:propertyId returns property`
- `O4: POST /properties/:propertyId/workspaces links workspace`
- `O4: GET /properties/:propertyId/workspaces lists linked workspaces`
- `O4: POST /device-capabilities registers capability`
- `O4: GET /device-capabilities lists capabilities for deviceType`
- `O4: PUT device state records state event in history`
- `O4: GET /workspaces/:workspaceId/history returns workspace state events`
- `O4: GET /workspaces/:workspaceId/events returns observability log`
- `O4: GET /workspaces/:workspaceId/health returns health summary`
- `O4: capability violation rejects invalid state update`
- `O4: GET /health returns enriched status with uptime`

---

## Architectural Notes

- All three DB adapters (inMemory, postgres, d1) are fully in sync for all O4 methods.
- The `validateStateUpdate` function uses an **open policy**: if no capabilities are registered for a device type, all state keys are accepted. This avoids breaking existing devices during gradual capability rollout.
- O4 services are injected as optional dependencies into `deviceService` — the service degrades gracefully if they are absent (backward compatibility with existing tests that construct `deviceService` directly).
- The `workspaceId` used in state-graph and observability events falls back to `current?.workspaceId || "unknown"` since the existing device records in inMemory seed do not carry `workspaceId` at query time. In production (postgres/d1) the `workspace_id` column on `omniverse_devices` provides the authoritative value.
