import { HttpError } from "../core/errors.js";

/**
 * ScheduleService — attach cron schedules to automations and trigger them.
 *
 * In O3 we store and retrieve schedules; actual cron execution is deferred to
 * a gateway runtime or an external job runner. The `triggerSchedule` method
 * simulates a scheduled fire (useful for tests and manual invocation).
 */
export function createScheduleService({ dbAdapter, automationService }) {
  return {
    async createSchedule({
      authCtx,
      workspaceId,
      automationId,
      cronExpr,
      timezone,
    }) {
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }

      if (!automationId || !cronExpr) {
        throw new HttpError(
          400,
          "SCHEDULE_INVALID",
          "automationId and cronExpr are required",
        );
      }

      const automation = await dbAdapter.getAutomation(automationId);
      if (!automation) {
        throw new HttpError(
          404,
          "AUTOMATION_NOT_FOUND",
          `Automation ${automationId} not found`,
        );
      }

      const schedule = {
        schedule_id: `sched_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        workspace_id: workspaceId,
        automation_id: automationId,
        cron_expr: cronExpr,
        timezone: timezone || "UTC",
        enabled: true,
        next_run_at: null,
        last_run_at: null,
        created_at: new Date().toISOString(),
      };

      return dbAdapter.createSchedule(schedule);
    },

    async listSchedules({ authCtx, workspaceId }) {
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }
      return dbAdapter.listSchedules(workspaceId);
    },

    /**
     * triggerSchedule — manually fire a schedule now (simulates cron tick).
     * Runs the linked automation and updates last_run_at.
     */
    async triggerSchedule({ authCtx, scheduleId }) {
      const schedule = await dbAdapter.getSchedule(scheduleId);
      if (!schedule) {
        throw new HttpError(
          404,
          "SCHEDULE_NOT_FOUND",
          `Schedule ${scheduleId} not found`,
        );
      }

      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(schedule.workspace_id);
      }

      const result = await automationService.runAutomation({
        authCtx,
        automationId: schedule.automation_id,
      });

      const now = new Date().toISOString();
      await dbAdapter.updateScheduleLastRun(scheduleId, now, null);

      return {
        scheduleId,
        automationId: schedule.automation_id,
        triggeredAt: now,
        automationResult: result,
      };
    },
  };
}
