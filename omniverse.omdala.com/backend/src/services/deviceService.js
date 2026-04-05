export function createDeviceService({ dbAdapter, roomRepository }) {
  return {
    async onboardDevice({ roomId, deviceId, name, type, initialState }) {
      // Ensure room exists in this phase via roomRepository
      const room = await roomRepository.getRoomState(roomId);
      if (!room) {
        throw new Error("ROOM_NOT_FOUND");
      }
      const device = {
        deviceId,
        name,
        type,
        state: initialState || {},
      };
      await dbAdapter.addDevice(roomId, {
        deviceId,
        name,
        type,
        state: initialState,
      });
      return { roomId, deviceId, name, type, state: initialState };
    },

    async getDeviceState(deviceId) {
      return dbAdapter.getDeviceState(deviceId);
    },

    async updateDeviceState(deviceId, state) {
      return dbAdapter.updateDeviceState(deviceId, state);
    },

    async listDevices(roomId) {
      return dbAdapter.listRoomDevices(roomId);
    },
  };
}
