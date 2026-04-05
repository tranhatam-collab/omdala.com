import { HttpError } from "../core/errors.js";

export function createStateGraphService({ dbAdapter }) {
  return {
    async recordStateChange({
      deviceId,
      workspaceId,
      previousState,
      newState,
      source,
      actorId,
    }) {
      const event = {
        event_id: crypto.randomUUID(),
        device_id: deviceId,
        workspace_id: workspaceId,
        previous_json: previousState ?? null,
        new_json: newState ?? null,
        source: source || "manual",
        actor_id: actorId || null,
        occurred_at: new Date().toISOString(),
      };
      return dbAdapter.appendStateEvent(event);
    },

    async listDeviceHistory({ deviceId, limit = 50 }) {
      if (!deviceId) {
        throw new HttpError(400, "INVALID_PARAMS", "deviceId is required");
      }
      return dbAdapter.listStateEvents(deviceId, limit);
    },

    async listWorkspaceHistory({ workspaceId, limit = 50 }) {
      if (!workspaceId) {
        throw new HttpError(400, "INVALID_PARAMS", "workspaceId is required");
      }
      return dbAdapter.listStateEventsByWorkspace(workspaceId, limit);
    },
  };
}
