# PHASE_O3_PLAN_2026.md

Version: 1.0
Status: DELIVERED
Delivered: 2026-04-05

---

## Scope

Phase O3 completes the Automation layer of AI Omniverse:

- Schedule-based and manual automation rules
- Simple actions engine (device state updates per rule)
- Multi-room state snapshot and home/office mode presets
- Gateway runtime v1: register, heartbeat, dispatch commands, ACK

Excluded from O3 (deferred to O4):

- MQTT/WebSocket transport for gateway (sidecar)
- Condition-based rule evaluation engine (polling)
- Cross-property automations
- Observability / alert delivery

---

## Deliverables

### Schema (postgres.sql + d1.sql)

| Table                        | Purpose                                        |
| ---------------------------- | ---------------------------------------------- |
| `omniverse_automations`      | Automation rules (trigger + actions)           |
| `omniverse_schedules`        | Cron schedules linked to automations           |
| `omniverse_gateways`         | Physical gateway registry                      |
| `omniverse_gateway_commands` | Command dispatch log (pending/sent/ack/failed) |

### Services

| File                   | Responsibility                                                        |
| ---------------------- | --------------------------------------------------------------------- |
| `automationService.js` | createAutomation, listAutomations, runAutomation                      |
| `scheduleService.js`   | createSchedule, listSchedules, triggerSchedule                        |
| `gatewayService.js`    | registerGateway, heartbeat, dispatchCommand, ackCommand, listCommands |
| `multiRoomService.js`  | getWorkspaceState (all rooms), applyPreset                            |

### API Routes (all under `/v2/omniverse/*`)

| Method | Path                                           | Auth                |
| ------ | ---------------------------------------------- | ------------------- |
| GET    | `/workspaces/:workspaceId/state`               | Bearer token        |
| POST   | `/workspaces/:workspaceId/preset`              | Bearer token        |
| POST   | `/automations`                                 | Bearer token        |
| GET    | `/automations?workspaceId=...`                 | Bearer token        |
| POST   | `/automations/:automationId/run`               | Bearer token        |
| POST   | `/schedules`                                   | Bearer token        |
| GET    | `/schedules?workspaceId=...`                   | Bearer token        |
| POST   | `/schedules/:scheduleId/trigger`               | Bearer token        |
| POST   | `/gateways`                                    | Bearer token        |
| GET    | `/gateways?workspaceId=...`                    | Bearer token        |
| POST   | `/gateways/:gatewayId/heartbeat`               | None (gateway-side) |
| POST   | `/gateways/:gatewayId/commands`                | Bearer token        |
| GET    | `/gateways/:gatewayId/commands`                | Bearer token        |
| POST   | `/gateways/:gatewayId/commands/:commandId/ack` | None (gateway-side) |

### Tests

20/20 pass (4 O1 + 6 O2 + 10 O3).

---

## Architecture notes

- automationService depends on deviceService for action execution — DI via index.js
- scheduleService depends on automationService (runAutomation on trigger)
- gatewayService is standalone; heartbeat + ack are unauthenticated (gateway token deferred to O4)
- multiRoomService uses dbAdapter.listRoomsByWorkspace + roomRepository.getRoomState per room
- All workspace-scoped routes enforce authCtx.assertWorkspaceAccess(workspaceId)
- Cron scheduling is stored but actual tick execution is external (worker/cron job); triggerSchedule simulates a manual tick

---

## O3 Definition of Done (from delivery plan)

- [x] User can create and run automation rules
- [x] Gateway runtime executes at least one scheduled + one manual rule (via triggerSchedule)
- [x] Multi-room state snapshot available at workspace level
- [x] 20/20 tests pass

---

## What O4 adds on top of O3

- Real transport layer for gateway (MQTT/WS sidecar)
- Condition-based rule evaluation engine
- Stronger state graph across multiple properties
- Observability baselines (alert delivery, proof log expansion)

---

## END OF FILE
