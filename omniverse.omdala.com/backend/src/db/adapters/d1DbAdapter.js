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
  };
}
