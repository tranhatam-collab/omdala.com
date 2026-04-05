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
          FROM omniverse_room_devices
          WHERE room_id = $1
          ORDER BY device_id ASC
        `,
        [roomId],
      );
      return result.rows;
    },
  };
}
