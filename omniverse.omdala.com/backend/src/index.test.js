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
