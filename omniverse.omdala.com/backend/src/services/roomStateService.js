import { HttpError } from "../core/errors.js";

export function createRoomStateService({ roomRepository }) {
  return {
    /**
     * Get room state with workspace authorization.
     *
     * @param {object} params
     * @param {object} params.authCtx  — context from authMiddleware.authenticate()
     * @param {string} params.roomId
     */
    async getRoomState({ authCtx, roomId }) {
      const roomState = await roomRepository.getRoomState(roomId);
      if (!roomState) {
        throw new HttpError(404, "ROOM_NOT_FOUND", "Room state not found");
      }

      authCtx.assertWorkspaceAccess(roomState.workspaceId);

      return {
        user: authCtx.user,
        roomState,
      };
    },
  };
}
