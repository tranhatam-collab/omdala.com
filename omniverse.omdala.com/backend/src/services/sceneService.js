import { HttpError } from "../core/errors.js";

export function createSceneService({ dbAdapter, roomRepository }) {
  return {
    async activateScene({ authCtx, roomId, sceneId, sceneName }) {
      // Ensure room exists and caller has workspace access
      const room = await roomRepository.getRoomState(roomId);
      if (!room) {
        throw new HttpError(404, "ROOM_NOT_FOUND", `Room ${roomId} not found`);
      }

      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(room.workspaceId);
      }

      const result = await dbAdapter.activateScene(roomId, sceneId, sceneName);
      return result;
    },

    async activateSceneById({ authCtx, workspaceId, sceneId }) {
      const scene = await dbAdapter.getScene(sceneId);
      if (!scene) {
        throw new HttpError(
          404,
          "SCENE_NOT_FOUND",
          `Scene ${sceneId} not found`,
        );
      }
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }
      return { sceneId, workspaceId, activatedAt: new Date().toISOString() };
    },

    async listScenes({ authCtx, workspaceId }) {
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }
      return dbAdapter.listScenes(workspaceId);
    },

    async createScene({ authCtx, workspaceId, name, actions }) {
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }
      if (!name) {
        throw new HttpError(400, "SCENE_INVALID", "name is required");
      }
      const scene = {
        scene_id: `scene_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        workspace_id: workspaceId,
        name,
        actions_json: actions || [],
        created_at: new Date().toISOString(),
      };
      return dbAdapter.createScene(scene);
    },

    async deleteScene({ authCtx, workspaceId, sceneId }) {
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }
      const removed = await dbAdapter.deleteScene(sceneId);
      if (!removed) {
        throw new HttpError(
          404,
          "SCENE_NOT_FOUND",
          `Scene ${sceneId} not found`,
        );
      }
      return { success: true, sceneId };
    },
  };
}
