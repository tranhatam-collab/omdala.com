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
          const authToken = request.headers.get("authorization");
          const authCtx = await loginService.buildAuthCtxFromToken(
            parseBearerToken(authToken),
          );
          const deviceSvc = require("./../backend/src/services/deviceService.js");
          // Fallback path if module resolution differs in runtime
          const svc = deviceSvc?.default || deviceSvc;
          const service =
            svc && typeof svc.createDeviceService === "function"
              ? svc.createDeviceService({})
              : null;
          // For skeleton, return a placeholder
          const onboard = {
            roomId: body.roomId,
            deviceId: body.deviceId,
            name: body.name,
            type: body.type,
            state: body.initialState || {},
          };
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
