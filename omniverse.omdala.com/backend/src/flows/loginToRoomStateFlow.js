export function createLoginToRoomStateFlow({ loginService, roomStateService }) {
  return {
    async execute({ email, password, roomId }) {
      const auth = await loginService.login({ email, password });
      const authCtx = await loginService.buildAuthCtxFromToken(
        auth.accessToken,
      );
      const room = await roomStateService.getRoomState({ authCtx, roomId });

      return {
        session: auth,
        roomState: room.roomState,
      };
    },
  };
}
