function normalizeDevice(device) {
  return {
    deviceId: String(device.device_id),
    name: String(device.name),
    type: String(device.type),
    state:
      typeof device.state_json === "string"
        ? JSON.parse(device.state_json)
        : device.state_json,
  };
}

export function createRoomRepository({ dbAdapter }) {
  return {
    async getRoomState(roomId) {
      const room = await dbAdapter.getRoomById(roomId);
      if (!room) {
        return null;
      }

      const devices = await dbAdapter.listRoomDevices(roomId);
      return {
        roomId: String(room.room_id),
        workspaceId: String(room.workspace_id),
        roomName: String(room.room_name),
        devices: devices.map(normalizeDevice),
        scene: {
          activeSceneId: String(room.active_scene_id),
          activeSceneName: String(room.active_scene_name),
        },
        updatedAt: String(room.updated_at),
      };
    },
  };
}
