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
  };
}
