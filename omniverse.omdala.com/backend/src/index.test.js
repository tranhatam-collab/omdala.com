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
