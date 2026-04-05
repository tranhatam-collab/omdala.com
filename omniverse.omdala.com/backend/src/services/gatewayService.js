import { HttpError } from "../core/errors.js";

/**
 * GatewayService — register physical gateways and dispatch device commands.
 *
 * In O3 the gateway is a runtime concept: it receives commands and ACKs them.
 * This service handles registry + command log; actual MQTT/WS transport is out-of-scope
 * for O3 and handled by a sidecar in O4.
 */
export function createGatewayService({ dbAdapter }) {
  return {
    async registerGateway({ authCtx, workspaceId, gatewayId, name, meta }) {
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }

      if (!gatewayId || !name) {
        throw new HttpError(
          400,
          "GATEWAY_INVALID",
          "gatewayId and name are required",
        );
      }

      const gateway = {
        gateway_id: gatewayId,
        workspace_id: workspaceId,
        name,
        status: "offline",
        last_seen_at: null,
        meta_json: meta || {},
        registered_at: new Date().toISOString(),
      };

      return dbAdapter.registerGateway(gateway);
    },

    async listGateways({ authCtx, workspaceId }) {
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(workspaceId);
      }
      return dbAdapter.listGateways(workspaceId);
    },

    async getGateway({ authCtx, gatewayId }) {
      const gw = await dbAdapter.getGateway(gatewayId);
      if (!gw) {
        throw new HttpError(
          404,
          "GATEWAY_NOT_FOUND",
          `Gateway ${gatewayId} not found`,
        );
      }
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(gw.workspace_id);
      }
      return gw;
    },

    /**
     * heartbeat — gateway calls this to mark itself online and update last_seen_at.
     */
    async heartbeat({ gatewayId }) {
      const now = new Date().toISOString();
      const gw = await dbAdapter.updateGatewayStatus(gatewayId, "online", now);
      if (!gw) {
        throw new HttpError(
          404,
          "GATEWAY_NOT_FOUND",
          `Gateway ${gatewayId} not found`,
        );
      }
      return { gatewayId, status: "online", lastSeenAt: now };
    },

    /**
     * dispatchCommand — enqueue a device command to a gateway's command log.
     * The gateway runtime polls or receives this and applies it to the physical device.
     */
    async dispatchCommand({ authCtx, gatewayId, deviceId, payload }) {
      const gw = await dbAdapter.getGateway(gatewayId);
      if (!gw) {
        throw new HttpError(
          404,
          "GATEWAY_NOT_FOUND",
          `Gateway ${gatewayId} not found`,
        );
      }
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(gw.workspace_id);
      }

      const command = {
        command_id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        gateway_id: gatewayId,
        device_id: deviceId,
        payload_json: payload || {},
        status: "pending",
        dispatched_at: new Date().toISOString(),
        ack_at: null,
      };

      return dbAdapter.addGatewayCommand(command);
    },

    /**
     * ackCommand — gateway calls this to confirm command execution.
     */
    async ackCommand({ gatewayId, commandId }) {
      const now = new Date().toISOString();
      const cmd = await dbAdapter.updateGatewayCommandStatus(
        commandId,
        "ack",
        now,
      );
      if (!cmd) {
        throw new HttpError(
          404,
          "COMMAND_NOT_FOUND",
          `Command ${commandId} not found`,
        );
      }
      return { commandId, gatewayId, status: "ack", ackAt: now };
    },

    async listCommands({ authCtx, gatewayId }) {
      const gw = await dbAdapter.getGateway(gatewayId);
      if (!gw) {
        throw new HttpError(
          404,
          "GATEWAY_NOT_FOUND",
          `Gateway ${gatewayId} not found`,
        );
      }
      if (authCtx?.assertWorkspaceAccess) {
        authCtx.assertWorkspaceAccess(gw.workspace_id);
      }
      return dbAdapter.listGatewayCommands(gatewayId);
    },
  };
}
