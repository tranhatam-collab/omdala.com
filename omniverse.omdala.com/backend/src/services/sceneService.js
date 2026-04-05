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
  };
}
