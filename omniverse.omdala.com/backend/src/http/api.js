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
}) {
  return {
    async handle(request) {
      const requestId = crypto.randomUUID();

      try {
        const url = new URL(request.url);
        const pathname = url.pathname;

        if (request.method === "GET" && pathname === "/health") {
          return json(200, {
            ok: true,
            data: { status: "ok" },
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
