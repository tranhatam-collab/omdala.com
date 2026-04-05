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
    {
      room_id: "room_bedroom_001",
      workspace_id: "workspace_home_001",
      room_name: "Master Bedroom",
      active_scene_id: "scene_night_mode",
      active_scene_name: "Night Mode",
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
    {
      room_id: "room_bedroom_001",
      device_id: "dev_light_002",
      name: "Bedroom Light",
      type: "light",
      state_json: { power: "off", brightness: 0 },
    },
  ],
  automations: [],
  schedules: [],
  gateways: [],
  gateway_commands: [],
};

export function createInMemoryDbAdapter(seed = DEFAULT_DATA) {
  const data = {
    rooms: [...seed.rooms],
    room_devices: [...seed.room_devices],
    automations: [...(seed.automations || [])],
    schedules: [...(seed.schedules || [])],
    gateways: [...(seed.gateways || [])],
    gateway_commands: [...(seed.gateway_commands || [])],
  };

  return {
    // ── Rooms ───────────────────────────────────────────────────────────────
    async getRoomById(roomId) {
      return data.rooms.find((room) => room.room_id === roomId) || null;
    },

    async listRoomsByWorkspace(workspaceId) {
      return data.rooms.filter((r) => r.workspace_id === workspaceId);
    },

    // ── Devices ─────────────────────────────────────────────────────────────
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

    async activateScene(roomId, sceneId, sceneName) {
      const room = data.rooms.find((r) => r.room_id === roomId);
      if (!room) return null;
      room.active_scene_id = sceneId;
      room.active_scene_name = sceneName;
      room.updated_at = new Date().toISOString();
      return { roomId, sceneId, sceneName, activatedAt: room.updated_at };
    },

    // ── Automations ─────────────────────────────────────────────────────────
    async createAutomation(automation) {
      data.automations.push(automation);
      return automation;
    },

    async listAutomations(workspaceId) {
      return data.automations.filter((a) => a.workspace_id === workspaceId);
    },

    async getAutomation(automationId) {
      return (
        data.automations.find((a) => a.automation_id === automationId) || null
      );
    },

    async updateAutomationLastRun(automationId, lastRunAt) {
      const a = data.automations.find((a) => a.automation_id === automationId);
      if (a) a.last_run_at = lastRunAt;
      return a || null;
    },

    // ── Schedules ───────────────────────────────────────────────────────────
    async createSchedule(schedule) {
      data.schedules.push(schedule);
      return schedule;
    },

    async listSchedules(workspaceId) {
      return data.schedules.filter((s) => s.workspace_id === workspaceId);
    },

    async getSchedule(scheduleId) {
      return data.schedules.find((s) => s.schedule_id === scheduleId) || null;
    },

    async updateScheduleLastRun(scheduleId, lastRunAt, nextRunAt) {
      const s = data.schedules.find((s) => s.schedule_id === scheduleId);
      if (s) {
        s.last_run_at = lastRunAt;
        s.next_run_at = nextRunAt || null;
      }
      return s || null;
    },

    // ── Gateways ────────────────────────────────────────────────────────────
    async registerGateway(gateway) {
      const existing = data.gateways.findIndex(
        (g) => g.gateway_id === gateway.gateway_id,
      );
      if (existing >= 0) {
        data.gateways[existing] = gateway;
      } else {
        data.gateways.push(gateway);
      }
      return gateway;
    },

    async getGateway(gatewayId) {
      return data.gateways.find((g) => g.gateway_id === gatewayId) || null;
    },

    async listGateways(workspaceId) {
      return data.gateways.filter((g) => g.workspace_id === workspaceId);
    },

    async updateGatewayStatus(gatewayId, status, lastSeenAt) {
      const g = data.gateways.find((g) => g.gateway_id === gatewayId);
      if (g) {
        g.status = status;
        g.last_seen_at = lastSeenAt;
      }
      return g || null;
    },

    async addGatewayCommand(command) {
      data.gateway_commands.push(command);
      return command;
    },

    async updateGatewayCommandStatus(commandId, status, ackAt) {
      const cmd = data.gateway_commands.find((c) => c.command_id === commandId);
      if (cmd) {
        cmd.status = status;
        if (ackAt) cmd.ack_at = ackAt;
      }
      return cmd || null;
    },

    async listGatewayCommands(gatewayId) {
      return data.gateway_commands.filter((c) => c.gateway_id === gatewayId);
    },
  };
}
