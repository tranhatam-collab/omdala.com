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
  properties: [],
  property_workspaces: [],
  device_capabilities: [],
  state_events: [],
  events: [],
};

export function createInMemoryDbAdapter(seed = DEFAULT_DATA) {
  const data = {
    rooms: [...seed.rooms],
    room_devices: [...seed.room_devices],
    automations: [...(seed.automations || [])],
    schedules: [...(seed.schedules || [])],
    gateways: [...(seed.gateways || [])],
    gateway_commands: [...(seed.gateway_commands || [])],
    properties: [...(seed.properties || [])],
    property_workspaces: [...(seed.property_workspaces || [])],
    device_capabilities: [...(seed.device_capabilities || [])],
    state_events: [...(seed.state_events || [])],
    events: [...(seed.events || [])],
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

    // ── O4: Properties ───────────────────────────────────────────────────────
    async createProperty(property) {
      data.properties.push(property);
      return property;
    },

    async getProperty(propertyId) {
      return data.properties.find((p) => p.property_id === propertyId) || null;
    },

    async listProperties(ownerUserId) {
      return data.properties.filter((p) => p.owner_user_id === ownerUserId);
    },

    async addPropertyWorkspace(propertyId, workspaceId) {
      const existing = data.property_workspaces.find(
        (pw) =>
          pw.property_id === propertyId && pw.workspace_id === workspaceId,
      );
      if (!existing) {
        const link = {
          property_id: propertyId,
          workspace_id: workspaceId,
          linked_at: new Date().toISOString(),
        };
        data.property_workspaces.push(link);
        return link;
      }
      return existing;
    },

    async listPropertyWorkspaces(propertyId) {
      return data.property_workspaces.filter(
        (pw) => pw.property_id === propertyId,
      );
    },

    // ── O4: Device capabilities ──────────────────────────────────────────────
    async registerCapability(capability) {
      const existing = data.device_capabilities.findIndex(
        (c) =>
          c.device_type === capability.device_type &&
          c.capability === capability.capability,
      );
      if (existing >= 0) {
        data.device_capabilities[existing] = capability;
      } else {
        data.device_capabilities.push(capability);
      }
      return capability;
    },

    async listCapabilities(deviceType) {
      return data.device_capabilities.filter(
        (c) => c.device_type === deviceType,
      );
    },

    async getCapability(deviceType, capability) {
      return (
        data.device_capabilities.find(
          (c) => c.device_type === deviceType && c.capability === capability,
        ) || null
      );
    },

    // ── O4: State graph ──────────────────────────────────────────────────────
    async appendStateEvent(event) {
      data.state_events.push(event);
      return event;
    },

    async listStateEvents(deviceId, limit = 50) {
      return data.state_events
        .filter((e) => e.device_id === deviceId)
        .slice(-limit)
        .reverse();
    },

    async listStateEventsByWorkspace(workspaceId, limit = 50) {
      return data.state_events
        .filter((e) => e.workspace_id === workspaceId)
        .slice(-limit)
        .reverse();
    },

    // ── O4: Observability ────────────────────────────────────────────────────
    async appendEvent(event) {
      data.events.push(event);
      return event;
    },

    async queryEvents(workspaceId, { eventType, limit = 100 } = {}) {
      let results = data.events.filter((e) => e.workspace_id === workspaceId);
      if (eventType) {
        results = results.filter((e) => e.event_type === eventType);
      }
      return results.slice(-limit).reverse();
    },

    async countEvents(workspaceId) {
      return data.events.filter((e) => e.workspace_id === workspaceId).length;
    },
  };
}
