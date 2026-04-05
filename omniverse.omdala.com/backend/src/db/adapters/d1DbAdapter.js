import { HttpError } from "../../core/errors.js";

function parseStateJson(raw) {
  if (typeof raw === "string") {
    return JSON.parse(raw);
  }
  return raw;
}

export function createD1DbAdapter({ d1 }) {
  if (!d1 || typeof d1.prepare !== "function") {
    throw new HttpError(
      500,
      "DB_CONFIG_ERROR",
      "D1 binding is required for d1 adapter",
    );
  }

  return {
    async getRoomById(roomId) {
      const stmt = d1.prepare(
        `
          SELECT room_id, workspace_id, room_name, active_scene_id, active_scene_name, updated_at
          FROM omniverse_rooms
          WHERE room_id = ?
          LIMIT 1
        `,
      );
      return (await stmt.bind(roomId).first()) || null;
    },

    async listRoomDevices(roomId) {
      const stmt = d1.prepare(
        `
          SELECT room_id, device_id, name, type, state_json
          FROM omniverse_devices
          WHERE room_id = ?
          ORDER BY device_id ASC
        `,
      );

      const result = await stmt.bind(roomId).all();
      return (result.results || []).map((row) => ({
        ...row,
        state_json: parseStateJson(row.state_json),
      }));
    },

    async addDevice(roomId, device) {
      const stateJson =
        typeof device.state === "string"
          ? device.state
          : JSON.stringify(device.state || {});
      const onboardedAt = new Date().toISOString();
      const stmt = d1.prepare(
        `
          INSERT INTO omniverse_devices (device_id, workspace_id, room_id, name, type, state_json, onboarded_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (device_id) DO UPDATE
            SET name = excluded.name,
                type = excluded.type,
                state_json = excluded.state_json
        `,
      );
      await stmt
        .bind(
          device.deviceId,
          device.workspaceId || "",
          roomId,
          device.name,
          device.type,
          stateJson,
          onboardedAt,
        )
        .run();
      return {
        device_id: device.deviceId,
        workspace_id: device.workspaceId || "",
        room_id: roomId,
        name: device.name,
        type: device.type,
        state_json: stateJson,
        onboarded_at: onboardedAt,
      };
    },

    async getDeviceState(deviceId) {
      const stmt = d1.prepare(
        `
          SELECT device_id, room_id, name, type, state_json
          FROM omniverse_devices
          WHERE device_id = ?
          LIMIT 1
        `,
      );
      const row = await stmt.bind(deviceId).first();
      if (!row) return null;
      return {
        deviceId: row.device_id,
        roomId: row.room_id,
        name: row.name,
        type: row.type,
        state: parseStateJson(row.state_json),
      };
    },

    async updateDeviceState(deviceId, newState) {
      const stateJson =
        typeof newState === "string" ? newState : JSON.stringify(newState);
      const stmt = d1.prepare(
        `
          UPDATE omniverse_devices
          SET state_json = ?
          WHERE device_id = ?
        `,
      );
      await stmt.bind(stateJson, deviceId).run();
      return {
        deviceId,
        state: parseStateJson(stateJson),
      };
    },

    async activateScene(roomId, sceneId, sceneName) {
      const now = new Date().toISOString();
      const stmt = d1.prepare(
        `
          UPDATE omniverse_rooms
          SET active_scene_id = ?, active_scene_name = ?, updated_at = ?
          WHERE room_id = ?
        `,
      );
      await stmt.bind(sceneId, sceneName, now, roomId).run();
      return { roomId, sceneId, sceneName, activatedAt: now };
    },

    // ── Multi-room ───────────────────────────────────────────────────────────
    async listRoomsByWorkspace(workspaceId) {
      const result = await d1
        .prepare(
          `SELECT room_id, workspace_id, room_name, active_scene_id, active_scene_name, updated_at
           FROM omniverse_rooms WHERE workspace_id = ? ORDER BY room_id ASC`,
        )
        .bind(workspaceId)
        .all();
      return result.results || [];
    },

    // ── Automations ──────────────────────────────────────────────────────────
    async createAutomation(automation) {
      await d1
        .prepare(
          `INSERT INTO omniverse_automations
             (automation_id, workspace_id, room_id, name, trigger_type, trigger_json, actions_json, enabled, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)`,
        )
        .bind(
          automation.automation_id,
          automation.workspace_id,
          automation.room_id || null,
          automation.name,
          automation.trigger_type,
          JSON.stringify(automation.trigger_json || {}),
          JSON.stringify(automation.actions_json || []),
          automation.enabled !== false ? 1 : 0,
          automation.created_at,
        )
        .run();
      return automation;
    },

    async listAutomations(workspaceId) {
      const result = await d1
        .prepare(
          `SELECT * FROM omniverse_automations WHERE workspace_id = ? ORDER BY created_at DESC`,
        )
        .bind(workspaceId)
        .all();
      return result.results || [];
    },

    async getAutomation(automationId) {
      return (
        (await d1
          .prepare(
            `SELECT * FROM omniverse_automations WHERE automation_id = ? LIMIT 1`,
          )
          .bind(automationId)
          .first()) || null
      );
    },

    async updateAutomationLastRun(automationId, lastRunAt) {
      await d1
        .prepare(
          `UPDATE omniverse_automations SET last_run_at = ? WHERE automation_id = ?`,
        )
        .bind(lastRunAt, automationId)
        .run();
      return { automation_id: automationId, last_run_at: lastRunAt };
    },

    // ── Schedules ────────────────────────────────────────────────────────────
    async createSchedule(schedule) {
      await d1
        .prepare(
          `INSERT INTO omniverse_schedules
             (schedule_id, workspace_id, automation_id, cron_expr, timezone, enabled, next_run_at, created_at)
           VALUES (?,?,?,?,?,?,?,?)`,
        )
        .bind(
          schedule.schedule_id,
          schedule.workspace_id,
          schedule.automation_id,
          schedule.cron_expr,
          schedule.timezone || "UTC",
          schedule.enabled !== false ? 1 : 0,
          schedule.next_run_at || null,
          schedule.created_at,
        )
        .run();
      return schedule;
    },

    async listSchedules(workspaceId) {
      const result = await d1
        .prepare(
          `SELECT * FROM omniverse_schedules WHERE workspace_id = ? ORDER BY created_at DESC`,
        )
        .bind(workspaceId)
        .all();
      return result.results || [];
    },

    async getSchedule(scheduleId) {
      return (
        (await d1
          .prepare(
            `SELECT * FROM omniverse_schedules WHERE schedule_id = ? LIMIT 1`,
          )
          .bind(scheduleId)
          .first()) || null
      );
    },

    async updateScheduleLastRun(scheduleId, lastRunAt, nextRunAt) {
      await d1
        .prepare(
          `UPDATE omniverse_schedules SET last_run_at = ?, next_run_at = ? WHERE schedule_id = ?`,
        )
        .bind(lastRunAt, nextRunAt || null, scheduleId)
        .run();
      return {
        schedule_id: scheduleId,
        last_run_at: lastRunAt,
        next_run_at: nextRunAt || null,
      };
    },

    // ── Gateways ─────────────────────────────────────────────────────────────
    async registerGateway(gateway) {
      await d1
        .prepare(
          `INSERT INTO omniverse_gateways
             (gateway_id, workspace_id, name, status, meta_json, registered_at)
           VALUES (?,?,?,?,?,?)
           ON CONFLICT (gateway_id) DO UPDATE
             SET name = excluded.name, meta_json = excluded.meta_json`,
        )
        .bind(
          gateway.gateway_id,
          gateway.workspace_id,
          gateway.name,
          gateway.status || "offline",
          JSON.stringify(gateway.meta_json || {}),
          gateway.registered_at,
        )
        .run();
      return gateway;
    },

    async getGateway(gatewayId) {
      return (
        (await d1
          .prepare(
            `SELECT * FROM omniverse_gateways WHERE gateway_id = ? LIMIT 1`,
          )
          .bind(gatewayId)
          .first()) || null
      );
    },

    async listGateways(workspaceId) {
      const result = await d1
        .prepare(
          `SELECT * FROM omniverse_gateways WHERE workspace_id = ? ORDER BY registered_at DESC`,
        )
        .bind(workspaceId)
        .all();
      return result.results || [];
    },

    async updateGatewayStatus(gatewayId, status, lastSeenAt) {
      await d1
        .prepare(
          `UPDATE omniverse_gateways SET status = ?, last_seen_at = ? WHERE gateway_id = ?`,
        )
        .bind(status, lastSeenAt, gatewayId)
        .run();
      return { gateway_id: gatewayId, status, last_seen_at: lastSeenAt };
    },

    async addGatewayCommand(command) {
      await d1
        .prepare(
          `INSERT INTO omniverse_gateway_commands
             (command_id, gateway_id, device_id, payload_json, status, dispatched_at)
           VALUES (?,?,?,?,?,?)`,
        )
        .bind(
          command.command_id,
          command.gateway_id,
          command.device_id,
          JSON.stringify(command.payload_json || {}),
          command.status || "pending",
          command.dispatched_at,
        )
        .run();
      return command;
    },

    async updateGatewayCommandStatus(commandId, status, ackAt) {
      await d1
        .prepare(
          `UPDATE omniverse_gateway_commands SET status = ?, ack_at = ? WHERE command_id = ?`,
        )
        .bind(status, ackAt || null, commandId)
        .run();
      return { command_id: commandId, status, ack_at: ackAt || null };
    },

    async listGatewayCommands(gatewayId) {
      const result = await d1
        .prepare(
          `SELECT * FROM omniverse_gateway_commands WHERE gateway_id = ? ORDER BY dispatched_at DESC`,
        )
        .bind(gatewayId)
        .all();
      return result.results || [];
    },

    // ── O4: Properties ────────────────────────────────────────────────────────
    async createProperty(property) {
      await d1
        .prepare(
          `INSERT INTO omniverse_properties
             (property_id, owner_user_id, name, address, type, meta_json, created_at)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .bind(
          property.property_id,
          property.owner_user_id,
          property.name,
          property.address || null,
          property.type || "residential",
          JSON.stringify(property.meta_json || {}),
          property.created_at,
        )
        .run();
      return property;
    },

    async getProperty(propertyId) {
      return (
        (await d1
          .prepare(
            `SELECT * FROM omniverse_properties WHERE property_id = ? LIMIT 1`,
          )
          .bind(propertyId)
          .first()) || null
      );
    },

    async listProperties(ownerUserId) {
      const result = await d1
        .prepare(
          `SELECT * FROM omniverse_properties WHERE owner_user_id = ? ORDER BY created_at DESC`,
        )
        .bind(ownerUserId)
        .all();
      return result.results || [];
    },

    async addPropertyWorkspace(propertyId, workspaceId) {
      const linkedAt = new Date().toISOString();
      await d1
        .prepare(
          `INSERT INTO omniverse_property_workspaces (property_id, workspace_id, linked_at)
           VALUES (?,?,?)
           ON CONFLICT (property_id, workspace_id) DO NOTHING`,
        )
        .bind(propertyId, workspaceId, linkedAt)
        .run();
      return {
        property_id: propertyId,
        workspace_id: workspaceId,
        linked_at: linkedAt,
      };
    },

    async listPropertyWorkspaces(propertyId) {
      const result = await d1
        .prepare(
          `SELECT * FROM omniverse_property_workspaces WHERE property_id = ? ORDER BY linked_at ASC`,
        )
        .bind(propertyId)
        .all();
      return result.results || [];
    },

    // ── O4: Device capabilities ───────────────────────────────────────────────
    async registerCapability(capability) {
      await d1
        .prepare(
          `INSERT INTO omniverse_device_capabilities
             (device_type, capability, value_type, min_value, max_value, allowed_json, created_at)
           VALUES (?,?,?,?,?,?,?)
           ON CONFLICT (device_type, capability) DO UPDATE
             SET value_type = excluded.value_type,
                 min_value = excluded.min_value,
                 max_value = excluded.max_value,
                 allowed_json = excluded.allowed_json`,
        )
        .bind(
          capability.device_type,
          capability.capability,
          capability.value_type,
          capability.min_value ?? null,
          capability.max_value ?? null,
          JSON.stringify(capability.allowed_json || null),
          capability.created_at,
        )
        .run();
      return capability;
    },

    async listCapabilities(deviceType) {
      const result = await d1
        .prepare(
          `SELECT * FROM omniverse_device_capabilities WHERE device_type = ? ORDER BY capability ASC`,
        )
        .bind(deviceType)
        .all();
      return result.results || [];
    },

    async getCapability(deviceType, capability) {
      return (
        (await d1
          .prepare(
            `SELECT * FROM omniverse_device_capabilities WHERE device_type = ? AND capability = ? LIMIT 1`,
          )
          .bind(deviceType, capability)
          .first()) || null
      );
    },

    // ── O4: State graph ───────────────────────────────────────────────────────
    async appendStateEvent(event) {
      await d1
        .prepare(
          `INSERT INTO omniverse_state_events
             (event_id, device_id, workspace_id, previous_json, new_json, source, actor_id, occurred_at)
           VALUES (?,?,?,?,?,?,?,?)`,
        )
        .bind(
          event.event_id,
          event.device_id,
          event.workspace_id,
          JSON.stringify(event.previous_json || null),
          JSON.stringify(event.new_json || null),
          event.source,
          event.actor_id || null,
          event.occurred_at,
        )
        .run();
      return event;
    },

    async listStateEvents(deviceId, limit = 50) {
      const result = await d1
        .prepare(
          `SELECT * FROM omniverse_state_events WHERE device_id = ? ORDER BY occurred_at DESC LIMIT ?`,
        )
        .bind(deviceId, limit)
        .all();
      return result.results || [];
    },

    async listStateEventsByWorkspace(workspaceId, limit = 50) {
      const result = await d1
        .prepare(
          `SELECT * FROM omniverse_state_events WHERE workspace_id = ? ORDER BY occurred_at DESC LIMIT ?`,
        )
        .bind(workspaceId, limit)
        .all();
      return result.results || [];
    },

    // ── O4: Observability ─────────────────────────────────────────────────────
    async appendEvent(event) {
      await d1
        .prepare(
          `INSERT INTO omniverse_events
             (event_id, workspace_id, event_type, subject_id, payload_json, severity, occurred_at)
           VALUES (?,?,?,?,?,?,?)`,
        )
        .bind(
          event.event_id,
          event.workspace_id,
          event.event_type,
          event.subject_id || null,
          JSON.stringify(event.payload_json || {}),
          event.severity || "info",
          event.occurred_at,
        )
        .run();
      return event;
    },

    async queryEvents(workspaceId, { eventType, limit = 100 } = {}) {
      if (eventType) {
        const result = await d1
          .prepare(
            `SELECT * FROM omniverse_events WHERE workspace_id = ? AND event_type = ? ORDER BY occurred_at DESC LIMIT ?`,
          )
          .bind(workspaceId, eventType, limit)
          .all();
        return result.results || [];
      }
      const result = await d1
        .prepare(
          `SELECT * FROM omniverse_events WHERE workspace_id = ? ORDER BY occurred_at DESC LIMIT ?`,
        )
        .bind(workspaceId, limit)
        .all();
      return result.results || [];
    },

    async countEvents(workspaceId) {
      const row = await d1
        .prepare(
          `SELECT COUNT(*) AS cnt FROM omniverse_events WHERE workspace_id = ?`,
        )
        .bind(workspaceId)
        .first();
      return row?.cnt ?? 0;
    },
  };
}
