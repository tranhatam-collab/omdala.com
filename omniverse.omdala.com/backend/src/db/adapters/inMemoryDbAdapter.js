const DEFAULT_DATA = {
  rooms: [
    {
      room_id: "room_living_001",
      workspace_id: "workspace_home_001",
      room_name: "Living Room",
      active_scene_id: "scene_evening_relax",
      active_scene_name: "Evening Relax",
      updated_at: new Date().toISOString(),
    },
  ],
  room_devices: [
    {
      room_id: "room_living_001",
      device_id: "dev_light_001",
      name: "Main Light",
      type: "light",
      state_json: { power: "on", brightness: 68 },
    },
    {
      room_id: "room_living_001",
      device_id: "dev_ac_001",
      name: "Air Conditioner",
      type: "climate",
      state_json: { power: "off", targetTempC: 24 },
    },
  ],
};

export function createInMemoryDbAdapter(seed = DEFAULT_DATA) {
  const data = {
    rooms: [...seed.rooms],
    room_devices: [...seed.room_devices],
  };

  return {
    async getRoomById(roomId) {
      return data.rooms.find((room) => room.room_id === roomId) || null;
    },

    async listRoomDevices(roomId) {
      return data.room_devices.filter((device) => device.room_id === roomId);
    },

    async addDevice(roomId, device) {
      const d = {
        room_id: roomId,
        device_id: device.deviceId,
        name: device.name,
        type: device.type,
        state_json: device.state?.toString?.()
          ? JSON.stringify(device.state)
          : device.state || {},
      };
      data.room_devices.push(d);
      return d;
    },

    async getDeviceState(deviceId) {
      const dev = data.room_devices.find((d) => d.device_id === deviceId);
      if (!dev) return null;
      return {
        deviceId: dev.device_id,
        roomId: dev.room_id,
        name: dev.name,
        type: dev.type,
        state:
          typeof dev.state_json === "string"
            ? JSON.parse(dev.state_json)
            : dev.state_json,
      };
    },

    async updateDeviceState(deviceId, newState) {
      const dev = data.room_devices.find((d) => d.device_id === deviceId);
      if (!dev) return null;
      dev.state_json =
        typeof newState === "string" ? newState : JSON.stringify(newState);
      return {
        deviceId: dev.device_id,
        state:
          typeof dev.state_json === "string"
            ? JSON.parse(dev.state_json)
            : dev.state_json,
      };
    },
  };
}
