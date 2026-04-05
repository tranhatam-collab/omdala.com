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
          FROM omniverse_room_devices
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
  };
}
