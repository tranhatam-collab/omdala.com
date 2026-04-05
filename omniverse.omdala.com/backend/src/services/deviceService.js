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

    async listWorkspaceDevices(workspaceId, roomId) {
      return dbAdapter.listWorkspaceDevices(workspaceId, roomId);
    },

    async getDevice(deviceId) {
      return dbAdapter.getDeviceById(deviceId);
    },

    async onboardWorkspaceDevice({
      workspaceId,
      roomId,
      name,
      type,
      externalId,
    }) {
      const deviceId =
        externalId ||
        `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      // If roomId given, validate room belongs to workspace
      if (roomId) {
        const room = await dbAdapter.getRoomById(roomId);
        if (!room || room.workspace_id !== workspaceId) {
          throw new Error("ROOM_NOT_FOUND_IN_WORKSPACE");
        }
      }
      const actualRoomId = roomId || null;
      const d = await dbAdapter.addDevice(actualRoomId, {
        deviceId,
        name,
        type,
        state: {},
      });
      return {
        id: d.device_id,
        name: d.name,
        type: d.type,
        roomId: d.room_id,
        workspaceId,
        status: "online",
        state: d.state_json || {},
      };
    },

    async deleteDevice(deviceId) {
      const removed = await dbAdapter.deleteDevice(deviceId);
      return removed ? { success: true, deviceId } : null;
    },
  };
}
