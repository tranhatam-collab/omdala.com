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

// ─── Phase O4 tests ────────────────────────────────────────────────────────

test("O4: POST /properties creates a property", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  const response = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/properties",
      "POST",
      {
        name: "Main Residence",
        address: "123 OMDALA St",
        type: "residential",
        meta: { floors: 2 },
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.ok, true);
  assert.ok(payload.data.property_id);
  assert.equal(payload.data.name, "Main Residence");
  assert.equal(payload.data.type, "residential");
});

test("O4: GET /properties lists properties for owner", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  // Create one first
  await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/properties",
      "POST",
      { name: "Office HQ", ownerUserId: "usr_omni_owner_001" },
      { authorization: `Bearer ${token}` },
    ),
  );

  const response = await runtime.api.handle(
    new Request(
      "http://localhost/v2/omniverse/properties?ownerUserId=usr_omni_owner_001",
      { method: "GET", headers: { authorization: `Bearer ${token}` } },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(payload.data));
  assert.ok(payload.data.length >= 1);
});

test("O4: GET /properties/:propertyId returns property", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  const createRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/properties",
      "POST",
      { name: "Beach House", ownerUserId: "usr_omni_owner_001" },
      { authorization: `Bearer ${token}` },
    ),
  );
  const { data: created } = await createRes.json();

  const response = await runtime.api.handle(
    new Request(
      `http://localhost/v2/omniverse/properties/${created.property_id}`,
      { method: "GET", headers: { authorization: `Bearer ${token}` } },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.property_id, created.property_id);
  assert.equal(payload.data.name, "Beach House");
});

test("O4: POST /properties/:propertyId/workspaces links workspace", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  const createRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/properties",
      "POST",
      { name: "Smart Villa", ownerUserId: "usr_omni_owner_001" },
      { authorization: `Bearer ${token}` },
    ),
  );
  const { data: prop } = await createRes.json();

  const response = await runtime.api.handle(
    createJsonRequest(
      `http://localhost/v2/omniverse/properties/${prop.property_id}/workspaces`,
      "POST",
      { workspaceId: "workspace_home_001" },
      { authorization: `Bearer ${token}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.data.property_id, prop.property_id);
  assert.equal(payload.data.workspace_id, "workspace_home_001");
});

test("O4: GET /properties/:propertyId/workspaces lists linked workspaces", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  const createRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/properties",
      "POST",
      { name: "Downtown Flat", ownerUserId: "usr_omni_owner_001" },
      { authorization: `Bearer ${token}` },
    ),
  );
  const { data: prop } = await createRes.json();

  await runtime.api.handle(
    createJsonRequest(
      `http://localhost/v2/omniverse/properties/${prop.property_id}/workspaces`,
      "POST",
      { workspaceId: "workspace_home_001" },
      { authorization: `Bearer ${token}` },
    ),
  );

  const response = await runtime.api.handle(
    new Request(
      `http://localhost/v2/omniverse/properties/${prop.property_id}/workspaces`,
      { method: "GET", headers: { authorization: `Bearer ${token}` } },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(payload.data));
  assert.ok(payload.data.length >= 1);
  assert.equal(payload.data[0].workspace_id, "workspace_home_001");
});

test("O4: POST /device-capabilities registers capability", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  const response = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/device-capabilities",
      "POST",
      {
        deviceType: "light",
        capability: "brightness",
        valueType: "number",
        minValue: 0,
        maxValue: 100,
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.device_type, "light");
  assert.equal(payload.data.capability, "brightness");
  assert.equal(payload.data.value_type, "number");
});

test("O4: GET /device-capabilities lists capabilities for deviceType", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  // Register two capabilities
  await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/device-capabilities",
      "POST",
      {
        deviceType: "climate",
        capability: "targetTempC",
        valueType: "number",
        minValue: 16,
        maxValue: 30,
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/device-capabilities",
      "POST",
      {
        deviceType: "climate",
        capability: "power",
        valueType: "enum",
        allowed: ["on", "off"],
      },
      { authorization: `Bearer ${token}` },
    ),
  );

  const response = await runtime.api.handle(
    new Request(
      "http://localhost/v2/omniverse/device-capabilities?deviceType=climate",
      { method: "GET", headers: { authorization: `Bearer ${token}` } },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(payload.data));
  assert.ok(payload.data.length >= 2);
});

test("O4: PUT device state records state event in history", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  // Update device state
  await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/devices/dev_light_001/state",
      "PUT",
      { state: { power: "on", brightness: 90 } },
      { authorization: `Bearer ${token}` },
    ),
  );

  const response = await runtime.api.handle(
    new Request("http://localhost/v2/omniverse/devices/dev_light_001/history", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.deviceId, "dev_light_001");
  assert.ok(Array.isArray(payload.data.history));
  assert.ok(payload.data.history.length >= 1);
  assert.equal(payload.data.history[0].device_id, "dev_light_001");
});

test("O4: GET /workspaces/:workspaceId/history returns workspace state events", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  // Trigger a state update to generate an event
  await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/devices/dev_ac_001/state",
      "PUT",
      { state: { power: "on", targetTempC: 25 } },
      { authorization: `Bearer ${token}` },
    ),
  );

  const response = await runtime.api.handle(
    new Request(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/history",
      { method: "GET", headers: { authorization: `Bearer ${token}` } },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(payload.data.history));
});

test("O4: GET /workspaces/:workspaceId/events returns observability log", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  // Trigger an event via device update
  await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/devices/dev_light_001/state",
      "PUT",
      { state: { power: "off" } },
      { authorization: `Bearer ${token}` },
    ),
  );

  const response = await runtime.api.handle(
    new Request(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/events",
      { method: "GET", headers: { authorization: `Bearer ${token}` } },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(payload.data.events));
});

test("O4: GET /workspaces/:workspaceId/health returns health summary", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  const response = await runtime.api.handle(
    new Request(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/health",
      { method: "GET", headers: { authorization: `Bearer ${token}` } },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.data.workspaceId, "workspace_home_001");
  assert.ok(typeof payload.data.eventCount === "number");
  assert.equal(payload.data.status, "ok");
});

test("O4: capability violation rejects invalid state update", async () => {
  const runtime = await createTestRuntime();
  const token = await loginAndGetToken(runtime);

  // Register strict capabilities for 'light'
  await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/device-capabilities",
      "POST",
      {
        deviceType: "light",
        capability: "power",
        valueType: "enum",
        allowed: ["on", "off"],
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/device-capabilities",
      "POST",
      {
        deviceType: "light",
        capability: "brightness",
        valueType: "number",
        minValue: 0,
        maxValue: 100,
      },
      { authorization: `Bearer ${token}` },
    ),
  );

  // Try to set an unknown capability key
  const response = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/devices/dev_light_001/state",
      "PUT",
      { state: { power: "on", unknownProp: "bad" } },
      { authorization: `Bearer ${token}` },
    ),
  );
  const payload = await response.json();

  assert.equal(response.status, 422);
  assert.equal(payload.error.code, "CAPABILITY_VIOLATION");
});

test("O4: GET /health returns enriched status with uptime", async () => {
  const runtime = await createTestRuntime();

  const response = await runtime.api.handle(
    new Request("http://localhost/health", { method: "GET" }),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.status, "ok");
  assert.ok(typeof payload.data.uptime === "number");
});

// ── Web client parity tests ──────────────────────────────────────────────────

async function loginGetToken(runtime) {
  const res = await runtime.api.handle(
    createJsonRequest("http://localhost/v2/omniverse/auth/login", "POST", {
      email: "owner@omdala.com",
      password: "demo-owner-pass",
    }),
  );
  const body = await res.json();
  return body.data.accessToken;
}

test("WEB: POST /auth/signup returns 201 with accessToken (fallback to login)", async () => {
  const runtime = await createTestRuntime();
  const res = await runtime.api.handle(
    createJsonRequest("http://localhost/v2/omniverse/auth/signup", "POST", {
      email: "owner@omdala.com",
      password: "demo-owner-pass",
      name: "New User",
    }),
  );
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.ok(body.data.accessToken);
});

test("WEB: GET /workspaces/:id returns workspace info", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const res = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001",
      "GET",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.data.workspace.id, "workspace_home_001");
});

test("WEB: GET /workspaces/:id/rooms lists rooms", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const res = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/rooms",
      "GET",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.data.rooms));
  assert.ok(body.data.rooms.length >= 2);
});

test("WEB: POST /workspaces/:id/rooms creates room", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const res = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/rooms",
      "POST",
      { name: "Kitchen" },
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.data.room.name, "Kitchen");
  assert.ok(body.data.room.id);
});

test("WEB: DELETE /workspaces/:id/rooms/:roomId removes room", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  // Create first
  const createRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/rooms",
      "POST",
      { name: "TempRoom" },
      { authorization: `Bearer ${token}` },
    ),
  );
  const created = await createRes.json();
  const roomId = created.data.room.id;

  const delRes = await runtime.api.handle(
    createJsonRequest(
      `http://localhost/v2/omniverse/workspaces/workspace_home_001/rooms/${roomId}`,
      "DELETE",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const delBody = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(delBody.data.success, true);
});

test("WEB: GET /workspaces/:id/devices lists all workspace devices", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const res = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/devices",
      "GET",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.data.devices));
  assert.ok(body.data.devices.length >= 2);
});

test("WEB: POST /workspaces/:id/devices onboards device", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const res = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/devices",
      "POST",
      { name: "Smart Lock", type: "lock", roomId: "room_living_001" },
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.data.device.name, "Smart Lock");
  assert.equal(body.data.device.type, "lock");
});

test("WEB: DELETE /workspaces/:id/devices/:deviceId removes device", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const delRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/devices/dev_light_001",
      "DELETE",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(body.data.success, true);
});

test("WEB: GET /workspaces/:id/scenes lists scenes", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const res = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/scenes",
      "GET",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.data.scenes));
});

test("WEB: POST /workspaces/:id/scenes creates scene", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const res = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/scenes",
      "POST",
      {
        name: "Movie Night",
        actions: [{ deviceId: "dev_light_001", state: { brightness: 20 } }],
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.data.scene.name, "Movie Night");
  assert.ok(body.data.scene.scene_id);
});

test("WEB: POST /workspaces/:id/scenes/:id/activate activates scene", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  // Create first
  const createRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/scenes",
      "POST",
      { name: "Party", actions: [] },
      { authorization: `Bearer ${token}` },
    ),
  );
  const created = await createRes.json();
  const sceneId = created.data.scene.scene_id;

  const actRes = await runtime.api.handle(
    createJsonRequest(
      `http://localhost/v2/omniverse/workspaces/workspace_home_001/scenes/${sceneId}/activate`,
      "POST",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const actBody = await actRes.json();
  assert.equal(actRes.status, 200);
  assert.equal(actBody.data.sceneId, sceneId);
});

test("WEB: DELETE /workspaces/:id/scenes/:id removes scene", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const createRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/scenes",
      "POST",
      { name: "TempScene", actions: [] },
      { authorization: `Bearer ${token}` },
    ),
  );
  const created = await createRes.json();
  const sceneId = created.data.scene.scene_id;

  const delRes = await runtime.api.handle(
    createJsonRequest(
      `http://localhost/v2/omniverse/workspaces/workspace_home_001/scenes/${sceneId}`,
      "DELETE",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(body.data.success, true);
});

test("WEB: GET /workspaces/:id/automations lists automations", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const res = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/automations",
      "GET",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.data.automations));
});

test("WEB: POST /workspaces/:id/automations creates automation", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const res = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/automations",
      "POST",
      {
        name: "Night Lights Off",
        trigger: { type: "time", value: "22:00" },
        actions: [{ deviceId: "dev_light_001", state: { power: false } }],
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.data.automation.name, "Night Lights Off");
});

test("WEB: POST /workspaces/:id/automations/:id/run runs automation", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  // Create first
  const createRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/automations",
      "POST",
      {
        name: "Run Test",
        trigger: { type: "manual" },
        actions: [{ deviceId: "dev_light_001", state: { power: false } }],
      },
      { authorization: `Bearer ${token}` },
    ),
  );
  const created = await createRes.json();
  const automationId = created.data.automation.automation_id;

  const runRes = await runtime.api.handle(
    createJsonRequest(
      `http://localhost/v2/omniverse/workspaces/workspace_home_001/automations/${automationId}/run`,
      "POST",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const runBody = await runRes.json();
  assert.equal(runRes.status, 200);
  assert.equal(runBody.data.automationId, automationId);
  assert.ok(runBody.data.ranAt);
});

test("WEB: DELETE /workspaces/:id/automations/:id removes automation", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  const createRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/workspaces/workspace_home_001/automations",
      "POST",
      { name: "TempAuto", trigger: { type: "manual" }, actions: [] },
      { authorization: `Bearer ${token}` },
    ),
  );
  const created = await createRes.json();
  const automationId = created.data.automation.automation_id;

  const delRes = await runtime.api.handle(
    createJsonRequest(
      `http://localhost/v2/omniverse/workspaces/workspace_home_001/automations/${automationId}`,
      "DELETE",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(body.data.success, true);
});

test("WEB: DELETE /properties/:id removes property", async () => {
  const runtime = await createTestRuntime();
  const token = await loginGetToken(runtime);
  // Create first
  const createRes = await runtime.api.handle(
    createJsonRequest(
      "http://localhost/v2/omniverse/properties",
      "POST",
      { ownerUserId: "usr_omni_owner_001", name: "My Home" },
      { authorization: `Bearer ${token}` },
    ),
  );
  const created = await createRes.json();
  const propertyId = created.data.property_id;

  const delRes = await runtime.api.handle(
    createJsonRequest(
      `http://localhost/v2/omniverse/properties/${propertyId}`,
      "DELETE",
      undefined,
      { authorization: `Bearer ${token}` },
    ),
  );
  const body = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(body.data.success, true);
});
