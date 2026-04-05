export function createDeviceService({
  dbAdapter,
  roomRepository,
  stateGraphService,
  deviceCapabilityService,
  observabilityService,
}) {
  return {
    async onboardDevice({ roomId, deviceId, name, type, initialState }) {
      const room = await roomRepository.getRoomState(roomId);
      if (!room) {
        throw new Error("ROOM_NOT_FOUND");
      }
      await dbAdapter.addDevice(roomId, {
        deviceId,
        name,
        type,
        state: initialState,
      });
      if (observabilityService) {
        await observabilityService.logEvent({
          workspaceId: room.workspaceId || room.workspace_id || "unknown",
          eventType: "device.onboarded",
          subjectId: deviceId,
          payload: { roomId, name, type },
          severity: "info",
        });
      }
      return { roomId, deviceId, name, type, state: initialState };
    },

    async getDeviceState(deviceId) {
      return dbAdapter.getDeviceState(deviceId);
    },

    async updateDeviceState(
      deviceId,
      state,
      { source, actorId, workspaceId } = {},
    ) {
      // 1. Get current state for diffing
      const current = await dbAdapter.getDeviceState(deviceId);

      // 2. Validate capabilities if service is present and device type is known
      if (deviceCapabilityService && current?.type) {
        await deviceCapabilityService.validateStateUpdate(current.type, state);
      }

      // 3. Persist the update
      const updated = await dbAdapter.updateDeviceState(deviceId, state);

      // 4. Record state-graph event
      if (stateGraphService && updated) {
        const ws = workspaceId || current?.workspaceId || "unknown";
        await stateGraphService.recordStateChange({
          deviceId,
          workspaceId: ws,
          previousState: current?.state ?? null,
          newState: updated.state,
          source: source || "manual",
          actorId: actorId || null,
        });
      }

      // 5. Emit observability event
      if (observabilityService && updated) {
        const ws = workspaceId || current?.workspaceId || "unknown";
        await observabilityService.logEvent({
          workspaceId: ws,
          eventType: "device.state_updated",
          subjectId: deviceId,
          payload: {
            previousState: current?.state,
            newState: updated.state,
            source,
          },
          severity: "info",
        });
      }

      return updated;
    },

    async listDevices(roomId) {
      return dbAdapter.listRoomDevices(roomId);
    },
  };
}
