import { HttpError } from "../core/errors.js";

/**
 * MultiRoomService — read aggregate state across all rooms in a workspace.
 *
 * Returns a workspace-level snapshot: room list, each with active scene
 * and device summary. This is the O3 foundation for home/office mode presets
 * and cross-room automations.
 */
export function createMultiRoomService({ dbAdapter, roomRepository }) {
  return {
    /**
     * getWorkspaceState — returns all rooms + their current state for a workspace.
     * authCtx.assertWorkspaceAccess enforces authorization.
     */
    async getWorkspaceState({ authCtx, workspaceId }) {
      if (!workspaceId) {
        throw new HttpError(
          400,
          "WORKSPACE_REQUIRED",
          "workspaceId is required",
        );
      }
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }

      const rooms = await dbAdapter.listRoomsByWorkspace(workspaceId);

      const roomStates = await Promise.all(
        rooms.map(async (room) => {
          const state = await roomRepository.getRoomState(room.room_id);
          return state;
        }),
      );

      // Filter out any nulls (rooms deleted mid-flight)
      const validRooms = roomStates.filter(Boolean);

      return {
        workspaceId,
        roomCount: validRooms.length,
        rooms: validRooms,
        snapshotAt: new Date().toISOString(),
      };
    },

    /**
     * applyPreset — apply a named mode preset (e.g. "home", "away", "sleep")
     * across all rooms in a workspace by activating the matching scene per room.
     *
     * presetScenes: [{ roomId, sceneId, sceneName }]
     */
    async applyPreset({ authCtx, workspaceId, presetName, presetScenes }) {
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }

      if (
        !presetScenes ||
        !Array.isArray(presetScenes) ||
        presetScenes.length === 0
      ) {
        throw new HttpError(
          400,
          "PRESET_INVALID",
          "presetScenes must be a non-empty array",
        );
      }

      const results = [];
      for (const { roomId, sceneId, sceneName } of presetScenes) {
        const result = await dbAdapter.activateScene(
          roomId,
          sceneId,
          sceneName,
        );
        results.push(result);
      }

      return {
        workspaceId,
        presetName,
        appliedAt: new Date().toISOString(),
        roomsUpdated: results.length,
        results,
      };
    },

    async listRooms({ workspaceId }) {
      const rows = await dbAdapter.listRoomsByWorkspace(workspaceId);
      return rows.map((r) => ({
        id: r.room_id,
        name: r.room_name,
        workspaceId: r.workspace_id,
      }));
    },

    async createRoom({ workspaceId, name }) {
      if (!name) {
        throw new HttpError(400, "ROOM_INVALID", "name is required");
      }
      const room = {
        room_id: `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        workspace_id: workspaceId,
        room_name: name,
        active_scene_id: null,
        active_scene_name: null,
        updated_at: new Date().toISOString(),
      };
      await dbAdapter.createRoom(room);
      return { id: room.room_id, name: room.room_name, workspaceId };
    },

    async deleteRoom({ workspaceId, roomId }) {
      const room = await dbAdapter.getRoomById(roomId);
      if (!room || room.workspace_id !== workspaceId) {
        throw new HttpError(
          404,
          "ROOM_NOT_FOUND",
          `Room ${roomId} not found in workspace`,
        );
      }
      await dbAdapter.deleteRoom(roomId);
      return { success: true, roomId };
    },
  };
}
