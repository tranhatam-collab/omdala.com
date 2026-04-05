import { HttpError } from "../../core/errors.js";

export async function createPostgresDbAdapter({ connectionString }) {
  if (!connectionString) {
    throw new HttpError(
      500,
      "DB_CONFIG_ERROR",
      "DATABASE_URL is required for postgres adapter",
    );
  }

  const pg = await import("pg");
  const pool = new pg.Pool({ connectionString });

  return {
    async getRoomById(roomId) {
      const result = await pool.query(
        `
          SELECT room_id, workspace_id, room_name, active_scene_id, active_scene_name, updated_at
          FROM omniverse_rooms
          WHERE room_id = $1
          LIMIT 1
        `,
        [roomId],
      );
      return result.rows[0] || null;
    },

    async listRoomDevices(roomId) {
      const result = await pool.query(
        `
          SELECT room_id, device_id, name, type, state_json
          FROM omniverse_devices
          WHERE room_id = $1
          ORDER BY device_id ASC
        `,
        [roomId],
      );
      return result.rows;
    },

    async addDevice(roomId, device) {
      const stateJson =
        typeof device.state === "string"
          ? device.state
          : JSON.stringify(device.state || {});
      const result = await pool.query(
        `
          INSERT INTO omniverse_devices (device_id, workspace_id, room_id, name, type, state_json)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (device_id) DO UPDATE
            SET name = EXCLUDED.name,
                type = EXCLUDED.type,
                state_json = EXCLUDED.state_json
          RETURNING *
        `,
        [
          device.deviceId,
          device.workspaceId || "",
          roomId,
          device.name,
          device.type,
          stateJson,
        ],
      );
      return result.rows[0];
    },

    async getDeviceState(deviceId) {
      const result = await pool.query(
        `
          SELECT device_id, room_id, name, type, state_json
          FROM omniverse_devices
          WHERE device_id = $1
          LIMIT 1
        `,
        [deviceId],
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        deviceId: row.device_id,
        roomId: row.room_id,
        name: row.name,
        type: row.type,
        state:
          typeof row.state_json === "string"
            ? JSON.parse(row.state_json)
            : row.state_json,
      };
    },

    async updateDeviceState(deviceId, newState) {
      const stateJson =
        typeof newState === "string" ? newState : JSON.stringify(newState);
      const result = await pool.query(
        `
          UPDATE omniverse_devices
          SET state_json = $2
          WHERE device_id = $1
          RETURNING device_id, state_json
        `,
        [deviceId, stateJson],
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        deviceId: row.device_id,
        state:
          typeof row.state_json === "string"
            ? JSON.parse(row.state_json)
            : row.state_json,
      };
    },

    async activateScene(roomId, sceneId, sceneName) {
      const now = new Date().toISOString();
      await pool.query(
        `
          UPDATE omniverse_rooms
          SET active_scene_id = $2, active_scene_name = $3, updated_at = $4
          WHERE room_id = $1
        `,
        [roomId, sceneId, sceneName, now],
      );
      return { roomId, sceneId, sceneName, activatedAt: now };
    },

    // ── Multi-room ───────────────────────────────────────────────────────────
    async listRoomsByWorkspace(workspaceId) {
      const result = await pool.query(
        `SELECT room_id, workspace_id, room_name, active_scene_id, active_scene_name, updated_at
         FROM omniverse_rooms WHERE workspace_id = $1 ORDER BY room_id ASC`,
        [workspaceId],
      );
      return result.rows;
    },

    // ── Automations ──────────────────────────────────────────────────────────
    async createAutomation(automation) {
      const result = await pool.query(
        `INSERT INTO omniverse_automations
           (automation_id, workspace_id, room_id, name, trigger_type, trigger_json, actions_json, enabled, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          automation.automation_id,
          automation.workspace_id,
          automation.room_id || null,
          automation.name,
          automation.trigger_type,
          JSON.stringify(automation.trigger_json || {}),
          JSON.stringify(automation.actions_json || []),
          automation.enabled !== false,
          automation.created_at,
        ],
      );
      return result.rows[0];
    },

    async listAutomations(workspaceId) {
      const result = await pool.query(
        `SELECT * FROM omniverse_automations WHERE workspace_id = $1 ORDER BY created_at DESC`,
        [workspaceId],
      );
      return result.rows;
    },

    async getAutomation(automationId) {
      const result = await pool.query(
        `SELECT * FROM omniverse_automations WHERE automation_id = $1 LIMIT 1`,
        [automationId],
      );
      return result.rows[0] || null;
    },

    async updateAutomationLastRun(automationId, lastRunAt) {
      const result = await pool.query(
        `UPDATE omniverse_automations SET last_run_at = $2 WHERE automation_id = $1 RETURNING *`,
        [automationId, lastRunAt],
      );
      return result.rows[0] || null;
    },

    // ── Schedules ────────────────────────────────────────────────────────────
    async createSchedule(schedule) {
      const result = await pool.query(
        `INSERT INTO omniverse_schedules
           (schedule_id, workspace_id, automation_id, cron_expr, timezone, enabled, next_run_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          schedule.schedule_id,
          schedule.workspace_id,
          schedule.automation_id,
          schedule.cron_expr,
          schedule.timezone || "UTC",
          schedule.enabled !== false,
          schedule.next_run_at || null,
          schedule.created_at,
        ],
      );
      return result.rows[0];
    },

    async listSchedules(workspaceId) {
      const result = await pool.query(
        `SELECT * FROM omniverse_schedules WHERE workspace_id = $1 ORDER BY created_at DESC`,
        [workspaceId],
      );
      return result.rows;
    },

    async getSchedule(scheduleId) {
      const result = await pool.query(
        `SELECT * FROM omniverse_schedules WHERE schedule_id = $1 LIMIT 1`,
        [scheduleId],
      );
      return result.rows[0] || null;
    },

    async updateScheduleLastRun(scheduleId, lastRunAt, nextRunAt) {
      const result = await pool.query(
        `UPDATE omniverse_schedules SET last_run_at = $2, next_run_at = $3 WHERE schedule_id = $1 RETURNING *`,
        [scheduleId, lastRunAt, nextRunAt || null],
      );
      return result.rows[0] || null;
    },

    // ── Gateways ─────────────────────────────────────────────────────────────
    async registerGateway(gateway) {
      const result = await pool.query(
        `INSERT INTO omniverse_gateways
           (gateway_id, workspace_id, name, status, meta_json, registered_at)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (gateway_id) DO UPDATE
           SET name = EXCLUDED.name, meta_json = EXCLUDED.meta_json
         RETURNING *`,
        [
          gateway.gateway_id,
          gateway.workspace_id,
          gateway.name,
          gateway.status || "offline",
          JSON.stringify(gateway.meta_json || {}),
          gateway.registered_at,
        ],
      );
      return result.rows[0];
    },

    async getGateway(gatewayId) {
      const result = await pool.query(
        `SELECT * FROM omniverse_gateways WHERE gateway_id = $1 LIMIT 1`,
        [gatewayId],
      );
      return result.rows[0] || null;
    },

    async listGateways(workspaceId) {
      const result = await pool.query(
        `SELECT * FROM omniverse_gateways WHERE workspace_id = $1 ORDER BY registered_at DESC`,
        [workspaceId],
      );
      return result.rows;
    },

    async updateGatewayStatus(gatewayId, status, lastSeenAt) {
      const result = await pool.query(
        `UPDATE omniverse_gateways SET status = $2, last_seen_at = $3 WHERE gateway_id = $1 RETURNING *`,
        [gatewayId, status, lastSeenAt],
      );
      return result.rows[0] || null;
    },

    async addGatewayCommand(command) {
      const result = await pool.query(
        `INSERT INTO omniverse_gateway_commands
           (command_id, gateway_id, device_id, payload_json, status, dispatched_at)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          command.command_id,
          command.gateway_id,
          command.device_id,
          JSON.stringify(command.payload_json || {}),
          command.status || "pending",
          command.dispatched_at,
        ],
      );
      return result.rows[0];
    },

    async updateGatewayCommandStatus(commandId, status, ackAt) {
      const result = await pool.query(
        `UPDATE omniverse_gateway_commands SET status = $2, ack_at = $3 WHERE command_id = $1 RETURNING *`,
        [commandId, status, ackAt || null],
      );
      return result.rows[0] || null;
    },

    async listGatewayCommands(gatewayId) {
      const result = await pool.query(
        `SELECT * FROM omniverse_gateway_commands WHERE gateway_id = $1 ORDER BY dispatched_at DESC`,
        [gatewayId],
      );
      return result.rows;
    },
  };
}
