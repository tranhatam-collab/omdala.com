import test from "node:test";
import assert from "node:assert/strict";
import { createOmniverseRuntime } from "./index.js";
import { createInMemoryDbAdapter } from "./db/adapters/inMemoryDbAdapter.js";
import { HttpError } from "./core/errors.js";

function createJsonRequest(url, method, body, headers = {}) {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function createMockSharedCoreClient() {
  return {
    async login({ email, password }) {
      if (email !== "owner@omdala.com" || password !== "demo-owner-pass") {
        throw new HttpError(
          401,
          "AUTH_INVALID_CREDENTIALS",
          "Invalid credentials",
        );
      }

      return {
        user: {
          id: "usr_omni_owner_001",
          email,
          displayName: "Omniverse Owner",
        },
        sharedSessionToken: "shared_token_001",
        accountProfile: {
          workspaceIds: ["workspace_home_001"],
        },
      };
    },

    async getSession() {
      return {
        user: {
          id: "usr_omni_owner_001",
          email: "owner@omdala.com",
          displayName: "Omniverse Owner",
        },
      };
    },

    async getAccountProfile() {
      return {
        workspaceIds: ["workspace_home_001"],
      };
    },
    async listWorkspaces(token) {
      // Provide lightweight workspace list for authCtx construction
      return [{ id: "workspace_home_001" }];
    },
  };
}

async function createTestRuntime(options = {}) {
  return createOmniverseRuntime({
    sharedCoreClient: options.sharedCoreClient || createMockSharedCoreClient(),
    dbAdapter: options.dbAdapter || createInMemoryDbAdapter(),
  });
}

test("O1 flow returns login session and room state", async () => {
  const runtime = await createTestRuntime();
  const request = createJsonRequest(
    "http://localhost/v2/omniverse/flows/login-room-state",
    "POST",
    {
      email: "owner@omdala.com",
      password: "demo-owner-pass",
      roomId: "room_living_001",
    },
  );

  const response = await runtime.api.handle(request);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.roomState.roomId, "room_living_001");
  assert.ok(payload.data.session.accessToken.startsWith("omni_"));
});

test("login fails for invalid credentials", async () => {
  const runtime = await createTestRuntime();
  const request = createJsonRequest(
    "http://localhost/v2/omniverse/auth/login",
    "POST",
    {
      email: "owner@omdala.com",
      password: "wrong",
    },
  );

  const response = await runtime.api.handle(request);
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.ok, false);
  assert.equal(payload.error.code, "AUTH_INVALID_CREDENTIALS");
});

test("room state endpoint requires bearer token", async () => {
  const runtime = await createTestRuntime();
  const request = new Request(
    "http://localhost/v2/omniverse/rooms/room_living_001/state",
    {
      method: "GET",
    },
  );

  const response = await runtime.api.handle(request);
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.error.code, "AUTH_MISSING_TOKEN");
});

test("room state denies access when workspace membership missing", async () => {
  const customSharedCoreNoSpace = {
    login: async ({ email, password }) => {
      if (email !== "owner@omdala.com" || password !== "demo-owner-pass") {
        throw new HttpError(
          401,
          "AUTH_INVALID_CREDENTIALS",
          "Invalid credentials",
        );
      }
      return {
        user: {
          id: "usr_omni_owner_001",
          email,
          displayName: "Omniverse Owner",
        },
        sharedSessionToken: "shared_token_001",
        accountProfile: { workspaceIds: [] },
      };
    },
    getSession: async () => ({
      user: {
        id: "usr_omni_owner_001",
        email: "owner@omdala.com",
        displayName: "Omniverse Owner",
      },
    }),
    getAccountProfile: async () => ({ workspaceIds: [] }),
    listWorkspaces: async () => [],
  };

  const runtime = await createTestRuntime({
    sharedCoreClient: customSharedCoreNoSpace,
  });

  const loginResponse = await runtime.api.handle(
    createJsonRequest("http://localhost/v2/omniverse/auth/login", "POST", {
      email: "owner@omdala.com",
      password: "demo-owner-pass",
    }),
  );
  const loginPayload = await loginResponse.json();

  const request = new Request(
    "http://localhost/v2/omniverse/rooms/room_living_001/state",
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${loginPayload.data.accessToken}`,
      },
    },
  );

  const response = await runtime.api.handle(request);
  const payload = await response.json();

  assert.equal(response.status, 403);
  assert.equal(payload.error.code, "WORKSPACE_FORBIDDEN");
});

// ─── Phase O2 tests ────────────────────────────────────────────────────────

test("O2: onboard device returns device data", async () => {
  const runtime = await createTestRuntime();
  const request = createJsonRequest(
    "http://localhost/v2/omniverse/devices/onboard",
    "POST",
    {
      roomId: "room_living_001",
      deviceId: "dev_new_001",
      name: "New Sensor",
      type: "sensor",
      initialState: { active: true },
    },
  );

  const response = await runtime.api.handle(request);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.deviceId, "dev_new_001");
  assert.equal(payload.data.roomId, "room_living_001");
  assert.equal(payload.data.name, "New Sensor");
});

test("O2: GET device state returns current state", async () => {
  const runtime = await createTestRuntime();

  // First login to get a token
  const loginRes = await runtime.api.handle(
    createJsonRequest("http://localhost/v2/omniverse/auth/login", "POST", {
      email: "owner@omdala.com",
      password: "demo-owner-pass",
    }),
  );
  const {
    data: { accessToken },
  } = await loginRes.json();

  const response = await runtime.api.handle(
    new Request("http://localhost/v2/omniverse/devices/dev_light_001/state", {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.deviceId, "dev_light_001");
  assert.ok(payload.data.state !== undefined);
});

test("O2: GET device state 404 for unknown device", async () => {
  const runtime = await createTestRuntime();

  const loginRes = await runtime.api.handle(
    createJsonRequest("http://localhost/v2/omniverse/auth/login", "POST", {
      email: "owner@omdala.com",
      password: "demo-owner-pass",
    }),
  );
  const {
    data: { accessToken },
  } = await loginRes.json();

  const response = await runtime.api.handle(
    new Request("http://localhost/v2/omniverse/devices/dev_nonexistent/state", {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 404);
  assert.equal(payload.error.code, "DEVICE_NOT_FOUND");
});

test("O2: PUT device state updates and returns new state", async () => {
  const runtime = await createTestRuntime();

  const loginRes = await runtime.api.handle(
    createJsonRequest("http://localhost/v2/omniverse/auth/login", "POST", {
      email: "owner@omdala.com",
      password: "demo-owner-pass",
    }),
  );
  const {
    data: { accessToken },
  } = await loginRes.json();

  const response = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/devices/dev_ac_001/state",
      "PUT",
      { state: { power: "on", targetTempC: 22 } },
      { authorization: `Bearer ${accessToken}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.deviceId, "dev_ac_001");
  assert.equal(payload.data.state.power, "on");
  assert.equal(payload.data.state.targetTempC, 22);
});

test("O2: GET room devices lists all devices", async () => {
  const runtime = await createTestRuntime();

  const loginRes = await runtime.api.handle(
    createJsonRequest("http://localhost/v2/omniverse/auth/login", "POST", {
      email: "owner@omdala.com",
      password: "demo-owner-pass",
    }),
  );
  const {
    data: { accessToken },
  } = await loginRes.json();

  const response = await runtime.api.handle(
    new Request("http://localhost/v2/omniverse/rooms/room_living_001/devices", {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.roomId, "room_living_001");
  assert.ok(Array.isArray(payload.data.devices));
  assert.ok(payload.data.devices.length >= 2);
});

test("O2: POST scene activate changes active scene", async () => {
  const runtime = await createTestRuntime();

  const loginRes = await runtime.api.handle(
    createJsonRequest("http://localhost/v2/omniverse/auth/login", "POST", {
      email: "owner@omdala.com",
      password: "demo-owner-pass",
    }),
  );
  const {
    data: { accessToken },
  } = await loginRes.json();

  const response = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/rooms/room_living_001/scene/activate",
      "POST",
      { sceneId: "scene_morning_bright", sceneName: "Morning Bright" },
      { authorization: `Bearer ${accessToken}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.sceneId, "scene_morning_bright");
  assert.equal(payload.data.sceneName, "Morning Bright");
  assert.equal(payload.data.roomId, "room_living_001");
});

// ─── Phase O3 tests ────────────────────────────────────────────────────────

async function loginAndGetToken(runtime) {
  const res = await runtime.api.handle(
    createJsonRequest("http://localhost/v2/omniverse/auth/login", "POST", {
      email: "owner@omdala.com",
      password: "demo-owner-pass",
    }),
  );
  const { data } = await res.json();
  return data.accessToken;
}

test("O3: GET workspace state returns all rooms snapshot", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  const response = await runtime.api.handle(
    new Request(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/state",
      { method: "GET", headers: { authorization: `Bearer ${token}` } },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.workspaceId, "workspace_home_001");
  assert.ok(Array.isArray(payload.data.rooms));
  assert.ok(payload.data.rooms.length >= 2);
  assert.ok(payload.data.snapshotAt);
});

test("O3: POST workspace preset applies scenes to all rooms", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  const response = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/preset",
      "POST",
      {
        presetName: "away",
        presetScenes: [
          {
            roomId: "room_living_001",
            sceneId: "scene_away",
            sceneName: "Away Mode",
          },
          {
            roomId: "room_bedroom_001",
            sceneId: "scene_away",
            sceneName: "Away Mode",
          },
        ],
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.presetName, "away");
  assert.equal(payload.data.roomsUpdated, 2);
});

test("O3: POST automation creates and returns automation", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  const response = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/automations",
      "POST",
      {
        workspaceId: "workspace_home_001",
        roomId: "room_living_001",
        name: "Evening Light On",
        triggerType: "schedule",
        triggerJson: { cron: "0 19 * * *" },
        actionsJson: [
          { deviceId: "dev_light_001", state: { power: "on", brightness: 80 } },
        ],
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.ok, true);
  assert.ok(payload.data.automation_id);
  assert.equal(payload.data.name, "Evening Light On");
  assert.equal(payload.data.trigger_type, "schedule");
});

test("O3: GET automations lists created automations", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  // Create one first
  await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/automations",
      "POST",
      {
        workspaceId: "workspace_home_001",
        name: "Test Rule",
        triggerType: "manual",
        actionsJson: [],
      },
      { authorization: `Bearer ${token}` },
    ),
  );

  const response = await runtime.api.handle(
    new Request(
      "http://localhost/v2/omniverse/automations?workspaceId=workspace_home_001",
      { method: "GET", headers: { authorization: `Bearer ${token}` } },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(payload.data));
  assert.ok(payload.data.length >= 1);
});

test("O3: POST automation run executes actions and updates last_run_at", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  // Create automation with a real device action
  const createRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/automations",
      "POST",
      {
        workspaceId: "workspace_home_001",
        name: "Night Mode",
        triggerType: "manual",
        actionsJson: [{ deviceId: "dev_light_001", state: { power: "off" } }],
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const { data: created } = await createRes.json();

  const response = await runtime.api.handle(
    createJsonRequest(
      `http://localhost/v2/omniverse/automations/${created.automation_id}/run`,
      "POST",
      {},
      { authorization: `Bearer ${token}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.automationId, created.automation_id);
  assert.equal(payload.data.actionsExecuted, 1);
  assert.ok(payload.data.ranAt);
});

test("O3: POST schedule creates schedule linked to automation", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  const autoRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/automations",
      "POST",
      {
        workspaceId: "workspace_home_001",
        name: "Morning Routine",
        triggerType: "schedule",
        actionsJson: [
          { deviceId: "dev_ac_001", state: { power: "on", targetTempC: 23 } },
        ],
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const { data: auto } = await autoRes.json();

  const response = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/schedules",
      "POST",
      {
        workspaceId: "workspace_home_001",
        automationId: auto.automation_id,
        cronExpr: "0 7 * * *",
        timezone: "Asia/Ho_Chi_Minh",
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.ok, true);
  assert.ok(payload.data.schedule_id);
  assert.equal(payload.data.cron_expr, "0 7 * * *");
  assert.equal(payload.data.automation_id, auto.automation_id);
});

test("O3: POST schedule trigger runs linked automation", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  // Create automation + schedule
  const autoRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/automations",
      "POST",
      {
        workspaceId: "workspace_home_001",
        name: "Sleep Mode",
        triggerType: "schedule",
        actionsJson: [{ deviceId: "dev_light_001", state: { power: "off" } }],
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const { data: auto } = await autoRes.json();

  const schedRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/schedules",
      "POST",
      {
        workspaceId: "workspace_home_001",
        automationId: auto.automation_id,
        cronExpr: "0 22 * * *",
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const { data: sched } = await schedRes.json();

  const response = await runtime.api.handle(
    createJsonRequest(
      `http://localhost/v2/omniverse/schedules/${sched.schedule_id}/trigger`,
      "POST",
      {},
      { authorization: `Bearer ${token}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.scheduleId, sched.schedule_id);
  assert.ok(payload.data.triggeredAt);
  assert.equal(payload.data.automationResult.actionsExecuted, 1);
});

test("O3: POST gateway registers gateway", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  const response = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/gateways",
      "POST",
      {
        workspaceId: "workspace_home_001",
        gatewayId: "gw_home_001",
        name: "Home Hub",
        meta: { firmware: "1.2.0" },
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.gateway_id, "gw_home_001");
  assert.equal(payload.data.name, "Home Hub");
  assert.equal(payload.data.status, "offline");
});

test("O3: POST gateway heartbeat marks gateway online", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  // Register first
  await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/gateways",
      "POST",
      {
        workspaceId: "workspace_home_001",
        gatewayId: "gw_home_002",
        name: "Bedroom Hub",
      },
      { authorization: `Bearer ${token}` },
    ),
  );

  const response = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/gateways/gw_home_002/heartbeat",
      "POST",
      {},
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.status, "online");
  assert.ok(payload.data.lastSeenAt);
});

test("O3: POST gateway command dispatches and can be ACKed", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/gateways",
      "POST",
      {
        workspaceId: "workspace_home_001",
        gatewayId: "gw_home_003",
        name: "Kitchen Hub",
      },
      { authorization: `Bearer ${token}` },
    ),
  );

  const dispatchRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/gateways/gw_home_003/commands",
      "POST",
      { deviceId: "dev_light_001", payload: { power: "on" } },
      { authorization: `Bearer ${token}` },
    ),
  );
  const { data: cmd } = await dispatchRes.json();

  assert.equal(dispatchRes.status, 201);
  assert.equal(cmd.status, "pending");
  assert.ok(cmd.command_id);

  // ACK it
  const ackRes = await runtime.api.handle(
    createJsonRequest(
      `http://localhost/v2/omniverse/gateways/gw_home_003/commands/${cmd.command_id}/ack`,
      "POST",
      {},
    ),
  );
  const ackPayload = await ackRes.json();

  assert.equal(ackRes.status, 200);
  assert.equal(ackPayload.data.status, "ack");
  assert.ok(ackPayload.data.ackAt);
});
