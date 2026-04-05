import { HttpError } from "../core/errors.js";

/**
 * AutomationService — create, list, and run condition/manual rules.
 *
 * A rule has:
 *   trigger_type: 'manual' | 'condition' | 'schedule'
 *   trigger_json: {} for manual; { field, op, value } for condition
 *   actions_json: [{ deviceId, state }]
 */
export function createAutomationService({ dbAdapter, deviceService }) {
  return {
    async createAutomation({
      authCtx,
      workspaceId,
      roomId,
      name,
      triggerType,
      triggerJson,
      actionsJson,
    }) {
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }

      if (!name || !triggerType) {
        throw new HttpError(
          400,
          "AUTOMATION_INVALID",
          "name and triggerType are required",
        );
      }

      const automation = {
        automation_id: `auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        workspace_id: workspaceId,
        room_id: roomId || null,
        name,
        trigger_type: triggerType,
        trigger_json: triggerJson || {},
        actions_json: actionsJson || [],
        enabled: true,
        last_run_at: null,
        created_at: new Date().toISOString(),
      };

      return dbAdapter.createAutomation(automation);
    },

    async listAutomations({ authCtx, workspaceId }) {
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }
      return dbAdapter.listAutomations(workspaceId);
    },

    /**
     * runAutomation — execute all actions in an automation rule immediately.
     * Works for trigger_type: 'manual' or 'schedule' (condition eval is caller's responsibility).
     */
    async runAutomation({ authCtx, automationId }) {
      const automation = await dbAdapter.getAutomation(automationId);
      if (!automation) {
        throw new HttpError(
          404,
          "AUTOMATION_NOT_FOUND",
          `Automation ${automationId} not found`,
        );
      }

      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(automation.workspace_id);
      }

      const actions =
        typeof automation.actions_json === "string"
          ? JSON.parse(automation.actions_json)
          : automation.actions_json || [];

      const results = [];
      for (const action of actions) {
        if (action.deviceId && action.state !== undefined) {
          const updated = await deviceService.updateDeviceState(
            action.deviceId,
            action.state,
          );
          results.push({
            deviceId: action.deviceId,
            applied: true,
            state: updated?.state,
          });
        }
      }

      const ranAt = new Date().toISOString();
      await dbAdapter.updateAutomationLastRun(automationId, ranAt);

      return {
        automationId,
        ranAt,
        actionsExecuted: results.length,
        results,
      };
    },
  };
}
