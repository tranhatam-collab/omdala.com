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
  };
}
