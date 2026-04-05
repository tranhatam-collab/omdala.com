export function createObservabilityService({ dbAdapter }) {
  return {
    async logEvent({ workspaceId, eventType, subjectId, payload, severity }) {
      const event = {
        event_id: crypto.randomUUID(),
        workspace_id: workspaceId,
        event_type: eventType,
        subject_id: subjectId || null,
        payload_json: payload || {},
        severity: severity || "info",
        occurred_at: new Date().toISOString(),
      };
      return dbAdapter.appendEvent(event);
    },

    async queryEvents({ workspaceId, eventType, limit = 100 }) {
      return dbAdapter.queryEvents(workspaceId, { eventType, limit });
    },

    async getHealthSummary({ workspaceId }) {
      const eventCount = await dbAdapter.countEvents(workspaceId);
      const recent = await dbAdapter.queryEvents(workspaceId, { limit: 1 });
      const lastEventAt = recent.length > 0 ? recent[0].occurred_at : null;
      return {
        workspaceId,
        eventCount,
        lastEventAt,
        status: "ok",
      };
    },
  };
}
