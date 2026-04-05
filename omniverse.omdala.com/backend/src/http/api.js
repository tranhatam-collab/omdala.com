import { HttpError, toErrorResponse } from "../core/errors.js";

function parseBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function safeJson(request) {
  const raw = await request.text();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON");
  }
}

function json(status, payload) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export function createOmniverseApi({
  loginService,
  roomStateService,
  loginToRoomStateFlow,
  deviceService,
  sceneService,
  automationService,
  scheduleService,
  gatewayService,
  multiRoomService,
  stateGraphService,
  deviceCapabilityService,
  propertyService,
  observabilityService,
}) {
  return {
    async handle(request) {
      const requestId = crypto.randomUUID();

      try {
        const url = new URL(request.url);
        const pathname = url.pathname;

        if (request.method === "GET" && pathname === "/health") {
          const healthData = { status: "ok", uptime: process.uptime?.() ?? 0 };
          return json(200, {
            ok: true,
            data: healthData,
            meta: { requestId },
          });
        }

        if (
          request.method === "POST" &&
          pathname === "/v2/omniverse/auth/login"
        ) {
          const body = await safeJson(request);
          const auth = await loginService.login({
            email: body.email,
            password: body.password,
          });
          return json(200, { ok: true, data: auth, meta: { requestId } });
        }

        if (
          request.method === "POST" &&
          pathname === "/v2/omniverse/flows/login-room-state"
        ) {
          const body = await safeJson(request);
          const result = await loginToRoomStateFlow.execute({
            email: body.email,
            password: body.password,
            roomId: body.roomId,
          });

          return json(200, { ok: true, data: result, meta: { requestId } });
        }

        if (
          request.method === "POST" &&
          pathname === "/v2/omniverse/devices/onboard"
        ) {
          const body = await safeJson(request);
          const onboard = await (deviceService?.onboardDevice
            ? deviceService.onboardDevice({
                roomId: body.roomId,
                deviceId: body.deviceId,
                name: body.name,
                type: body.type,
                initialState: body.initialState,
              })
            : {
                roomId: body.roomId,
                deviceId: body.deviceId,
                name: body.name,
                type: body.type,
                state: body.initialState ?? {},
              });
          return json(200, { ok: true, data: onboard, meta: { requestId } });
        }

        const roomMatch = pathname.match(
          /^\/v2\/omniverse\/rooms\/([^/]+)\/state$/,
        );
        if (request.method === "GET" && roomMatch) {
          const roomId = roomMatch[1];
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const room = await roomStateService.getRoomState({ authCtx, roomId });
          return json(200, { ok: true, data: room, meta: { requestId } });
        }

        // GET /v2/omniverse/rooms/:roomId/devices
        const roomDevicesMatch = pathname.match(
          /^\/v2\/omniverse\/rooms\/([^/]+)\/devices$/,
        );
        if (request.method === "GET" && roomDevicesMatch) {
          const roomId = roomDevicesMatch[1];
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const devices = await deviceService.listDevices(roomId, authCtx);
          return json(200, {
            ok: true,
            data: { roomId, devices },
            meta: { requestId },
          });
        }

        // POST /v2/omniverse/rooms/:roomId/scene/activate
        const sceneActivateMatch = pathname.match(
          /^\/v2\/omniverse\/rooms\/([^/]+)\/scene\/activate$/,
        );
        if (request.method === "POST" && sceneActivateMatch) {
          const roomId = sceneActivateMatch[1];
          const body = await safeJson(request);
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const result = await sceneService.activateScene({
            authCtx,
            roomId,
            sceneId: body.sceneId,
            sceneName: body.sceneName,
          });
          return json(200, { ok: true, data: result, meta: { requestId } });
        }

        // GET /v2/omniverse/devices/:deviceId/state
        const deviceStateMatch = pathname.match(
          /^\/v2\/omniverse\/devices\/([^/]+)\/state$/,
        );
        if (request.method === "GET" && deviceStateMatch) {
          const deviceId = deviceStateMatch[1];
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken); // validate token
          const state = await deviceService.getDeviceState(deviceId);
          if (!state) {
            throw new HttpError(
              404,
              "DEVICE_NOT_FOUND",
              `Device ${deviceId} not found`,
            );
          }
          return json(200, { ok: true, data: state, meta: { requestId } });
        }

        // PUT /v2/omniverse/devices/:deviceId/state
        if (request.method === "PUT" && deviceStateMatch) {
          const deviceId = deviceStateMatch[1];
          const body = await safeJson(request);
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken); // validate token
          const updated = await deviceService.updateDeviceState(
            deviceId,
            body.state ?? body,
          );
          if (!updated) {
            throw new HttpError(
              404,
              "DEVICE_NOT_FOUND",
              `Device ${deviceId} not found`,
            );
          }
          return json(200, { ok: true, data: updated, meta: { requestId } });
        }

        // ── O3: Multi-room ────────────────────────────────────────────────────

        // GET /v2/omniverse/workspaces/:workspaceId/state
        const workspaceStateMatch = pathname.match(
          /^\/v2\/omniverse\/workspaces\/([^/]+)\/state$/,
        );
        if (request.method === "GET" && workspaceStateMatch) {
          const workspaceId = workspaceStateMatch[1];
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const state = await multiRoomService.getWorkspaceState({
            authCtx,
            workspaceId,
          });
          return json(200, { ok: true, data: state, meta: { requestId } });
        }

        // POST /v2/omniverse/workspaces/:workspaceId/preset
        const workspacePresetMatch = pathname.match(
          /^\/v2\/omniverse\/workspaces\/([^/]+)\/preset$/,
        );
        if (request.method === "POST" && workspacePresetMatch) {
          const workspaceId = workspacePresetMatch[1];
          const body = await safeJson(request);
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const result = await multiRoomService.applyPreset({
            authCtx,
            workspaceId,
            presetName: body.presetName,
            presetScenes: body.presetScenes,
          });
          return json(200, { ok: true, data: result, meta: { requestId } });
        }

        // ── O3: Automations ───────────────────────────────────────────────────

        // POST /v2/omniverse/automations
        if (
          request.method === "POST" &&
          pathname === "/v2/omniverse/automations"
        ) {
          const body = await safeJson(request);
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const result = await automationService.createAutomation({
            authCtx,
            workspaceId: body.workspaceId,
            roomId: body.roomId,
            name: body.name,
            triggerType: body.triggerType,
            triggerJson: body.triggerJson,
            actionsJson: body.actionsJson,
          });
          return json(201, { ok: true, data: result, meta: { requestId } });
        }

        // GET /v2/omniverse/automations?workspaceId=...
        if (
          request.method === "GET" &&
          pathname === "/v2/omniverse/automations"
        ) {
          const workspaceId = new URL(request.url).searchParams.get(
            "workspaceId",
          );
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const list = await automationService.listAutomations({
            authCtx,
            workspaceId,
          });
          return json(200, { ok: true, data: list, meta: { requestId } });
        }

        // POST /v2/omniverse/automations/:automationId/run
        const automationRunMatch = pathname.match(
          /^\/v2\/omniverse\/automations\/([^/]+)\/run$/,
        );
        if (request.method === "POST" && automationRunMatch) {
          const automationId = automationRunMatch[1];
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const result = await automationService.runAutomation({
            authCtx,
            automationId,
          });
          return json(200, { ok: true, data: result, meta: { requestId } });
        }

        // ── O3: Schedules ─────────────────────────────────────────────────────

        // POST /v2/omniverse/schedules
        if (
          request.method === "POST" &&
          pathname === "/v2/omniverse/schedules"
        ) {
          const body = await safeJson(request);
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const result = await scheduleService.createSchedule({
            authCtx,
            workspaceId: body.workspaceId,
            automationId: body.automationId,
            cronExpr: body.cronExpr,
            timezone: body.timezone,
          });
          return json(201, { ok: true, data: result, meta: { requestId } });
        }

        // GET /v2/omniverse/schedules?workspaceId=...
        if (
          request.method === "GET" &&
          pathname === "/v2/omniverse/schedules"
        ) {
          const workspaceId = new URL(request.url).searchParams.get(
            "workspaceId",
          );
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const list = await scheduleService.listSchedules({
            authCtx,
            workspaceId,
          });
          return json(200, { ok: true, data: list, meta: { requestId } });
        }

        // POST /v2/omniverse/schedules/:scheduleId/trigger
        const scheduleTriggerMatch = pathname.match(
          /^\/v2\/omniverse\/schedules\/([^/]+)\/trigger$/,
        );
        if (request.method === "POST" && scheduleTriggerMatch) {
          const scheduleId = scheduleTriggerMatch[1];
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const result = await scheduleService.triggerSchedule({
            authCtx,
            scheduleId,
          });
          return json(200, { ok: true, data: result, meta: { requestId } });
        }

        // ── O3: Gateways ──────────────────────────────────────────────────────

        // POST /v2/omniverse/gateways
        if (
          request.method === "POST" &&
          pathname === "/v2/omniverse/gateways"
        ) {
          const body = await safeJson(request);
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const result = await gatewayService.registerGateway({
            authCtx,
            workspaceId: body.workspaceId,
            gatewayId: body.gatewayId,
            name: body.name,
            meta: body.meta,
          });
          return json(201, { ok: true, data: result, meta: { requestId } });
        }

        // GET /v2/omniverse/gateways?workspaceId=...
        if (request.method === "GET" && pathname === "/v2/omniverse/gateways") {
          const workspaceId = new URL(request.url).searchParams.get(
            "workspaceId",
          );
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const list = await gatewayService.listGateways({
            authCtx,
            workspaceId,
          });
          return json(200, { ok: true, data: list, meta: { requestId } });
        }

        // POST /v2/omniverse/gateways/:gatewayId/heartbeat  (no auth — gateway-side call)
        const gatewayHeartbeatMatch = pathname.match(
          /^\/v2\/omniverse\/gateways\/([^/]+)\/heartbeat$/,
        );
        if (request.method === "POST" && gatewayHeartbeatMatch) {
          const gatewayId = gatewayHeartbeatMatch[1];
          const result = await gatewayService.heartbeat({ gatewayId });
          return json(200, { ok: true, data: result, meta: { requestId } });
        }

        // POST /v2/omniverse/gateways/:gatewayId/commands
        const gatewayCommandsMatch = pathname.match(
          /^\/v2\/omniverse\/gateways\/([^/]+)\/commands$/,
        );
        if (request.method === "POST" && gatewayCommandsMatch) {
          const gatewayId = gatewayCommandsMatch[1];
          const body = await safeJson(request);
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const result = await gatewayService.dispatchCommand({
            authCtx,
            gatewayId,
            deviceId: body.deviceId,
            payload: body.payload,
          });
          return json(201, { ok: true, data: result, meta: { requestId } });
        }

        // GET /v2/omniverse/gateways/:gatewayId/commands
        if (request.method === "GET" && gatewayCommandsMatch) {
          const gatewayId = gatewayCommandsMatch[1];
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const list = await gatewayService.listCommands({
            authCtx,
            gatewayId,
          });
          return json(200, { ok: true, data: list, meta: { requestId } });
        }

        // POST /v2/omniverse/gateways/:gatewayId/commands/:commandId/ack
        const gatewayAckMatch = pathname.match(
          /^\/v2\/omniverse\/gateways\/([^/]+)\/commands\/([^/]+)\/ack$/,
        );
        if (request.method === "POST" && gatewayAckMatch) {
          const [, gatewayId, commandId] = gatewayAckMatch;
          const result = await gatewayService.ackCommand({
            gatewayId,
            commandId,
          });
          return json(200, { ok: true, data: result, meta: { requestId } });
        }

        // ── O4: Properties ────────────────────────────────────────────────────

        // POST /v2/omniverse/properties
        if (
          request.method === "POST" &&
          pathname === "/v2/omniverse/properties"
        ) {
          const body = await safeJson(request);
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          const authCtx = await loginService.buildAuthCtxFromToken(accessToken);
          const result = await propertyService.createProperty({
            ownerUserId: body.ownerUserId || authCtx.user.id,
            name: body.name,
            address: body.address,
            type: body.type,
            meta: body.meta,
          });
          return json(201, { ok: true, data: result, meta: { requestId } });
        }

        // GET /v2/omniverse/properties?ownerUserId=...
        if (
          request.method === "GET" &&
          pathname === "/v2/omniverse/properties"
        ) {
          const ownerUserId = new URL(request.url).searchParams.get(
            "ownerUserId",
          );
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken);
          const list = await propertyService.listProperties({ ownerUserId });
          return json(200, { ok: true, data: list, meta: { requestId } });
        }

        // GET /v2/omniverse/properties/:propertyId
        const propertyMatch = pathname.match(
          /^\/v2\/omniverse\/properties\/([^/]+)$/,
        );
        if (request.method === "GET" && propertyMatch) {
          const propertyId = propertyMatch[1];
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken);
          const property = await propertyService.getProperty({ propertyId });
          return json(200, { ok: true, data: property, meta: { requestId } });
        }

        // POST /v2/omniverse/properties/:propertyId/workspaces
        const propertyWorkspacesMatch = pathname.match(
          /^\/v2\/omniverse\/properties\/([^/]+)\/workspaces$/,
        );
        if (request.method === "POST" && propertyWorkspacesMatch) {
          const propertyId = propertyWorkspacesMatch[1];
          const body = await safeJson(request);
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken);
          const result = await propertyService.addWorkspaceToProperty({
            propertyId,
            workspaceId: body.workspaceId,
          });
          return json(201, { ok: true, data: result, meta: { requestId } });
        }

        // GET /v2/omniverse/properties/:propertyId/workspaces
        if (request.method === "GET" && propertyWorkspacesMatch) {
          const propertyId = propertyWorkspacesMatch[1];
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken);
          const list = await propertyService.listPropertyWorkspaces({
            propertyId,
          });
          return json(200, { ok: true, data: list, meta: { requestId } });
        }

        // ── O4: Device capabilities ───────────────────────────────────────────

        // POST /v2/omniverse/device-capabilities
        if (
          request.method === "POST" &&
          pathname === "/v2/omniverse/device-capabilities"
        ) {
          const body = await safeJson(request);
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken);
          const result = await deviceCapabilityService.registerCapability({
            deviceType: body.deviceType,
            capability: body.capability,
            valueType: body.valueType,
            minValue: body.minValue,
            maxValue: body.maxValue,
            allowed: body.allowed,
          });
          return json(201, { ok: true, data: result, meta: { requestId } });
        }

        // GET /v2/omniverse/device-capabilities?deviceType=...
        if (
          request.method === "GET" &&
          pathname === "/v2/omniverse/device-capabilities"
        ) {
          const deviceType = new URL(request.url).searchParams.get(
            "deviceType",
          );
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken);
          const list = await deviceCapabilityService.listCapabilities({
            deviceType,
          });
          return json(200, { ok: true, data: list, meta: { requestId } });
        }

        // ── O4: State graph ───────────────────────────────────────────────────

        // GET /v2/omniverse/devices/:deviceId/history
        const deviceHistoryMatch = pathname.match(
          /^\/v2\/omniverse\/devices\/([^/]+)\/history$/,
        );
        if (request.method === "GET" && deviceHistoryMatch) {
          const deviceId = deviceHistoryMatch[1];
          const limit =
            Number(new URL(request.url).searchParams.get("limit")) || 50;
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken);
          const history = await stateGraphService.listDeviceHistory({
            deviceId,
            limit,
          });
          return json(200, {
            ok: true,
            data: { deviceId, history },
            meta: { requestId },
          });
        }

        // GET /v2/omniverse/workspaces/:workspaceId/history
        const workspaceHistoryMatch = pathname.match(
          /^\/v2\/omniverse\/workspaces\/([^/]+)\/history$/,
        );
        if (request.method === "GET" && workspaceHistoryMatch) {
          const workspaceId = workspaceHistoryMatch[1];
          const limit =
            Number(new URL(request.url).searchParams.get("limit")) || 50;
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken);
          const history = await stateGraphService.listWorkspaceHistory({
            workspaceId,
            limit,
          });
          return json(200, {
            ok: true,
            data: { workspaceId, history },
            meta: { requestId },
          });
        }

        // ── O4: Observability ─────────────────────────────────────────────────

        // GET /v2/omniverse/workspaces/:workspaceId/events
        const workspaceEventsMatch = pathname.match(
          /^\/v2\/omniverse\/workspaces\/([^/]+)\/events$/,
        );
        if (request.method === "GET" && workspaceEventsMatch) {
          const workspaceId = workspaceEventsMatch[1];
          const searchParams = new URL(request.url).searchParams;
          const eventType = searchParams.get("eventType") || undefined;
          const limit = Number(searchParams.get("limit")) || 100;
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken);
          const events = await observabilityService.queryEvents({
            workspaceId,
            eventType,
            limit,
          });
          return json(200, {
            ok: true,
            data: { workspaceId, events },
            meta: { requestId },
          });
        }

        // GET /v2/omniverse/workspaces/:workspaceId/health
        const workspaceHealthMatch = pathname.match(
          /^\/v2\/omniverse\/workspaces\/([^/]+)\/health$/,
        );
        if (request.method === "GET" && workspaceHealthMatch) {
          const workspaceId = workspaceHealthMatch[1];
          const accessToken = parseBearerToken(
            request.headers.get("authorization"),
          );
          await loginService.buildAuthCtxFromToken(accessToken);
          const summary = await observabilityService.getHealthSummary({
            workspaceId,
          });
          return json(200, { ok: true, data: summary, meta: { requestId } });
        }

        return json(404, {
          ok: false,
          error: { code: "NOT_FOUND", message: "Endpoint not found" },
          meta: { requestId },
        });
      } catch (error) {
        const mapped = toErrorResponse(error, requestId);
        return json(mapped.status, mapped.body);
      }
    },
  };
}
