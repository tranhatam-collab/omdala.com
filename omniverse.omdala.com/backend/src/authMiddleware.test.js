import test from "node:test";
import assert from "node:assert/strict";
import { createAuthMiddleware } from "./http/authMiddleware.js";

function makeReq(token) {
  return {
    headers: {
      get: (name) =>
        name.toLowerCase() === "authorization" ? `Bearer ${token ?? ""}` : null,
    },
  };
}

test("auth middleware - missing token", async () => {
  const middleware = createAuthMiddleware({
    sessionStore: { getByToken: () => null },
    sharedCoreClient: {},
  });
  try {
    await middleware.authenticate({ headers: { get: () => null } });
    assert.fail("should throw");
  } catch (e) {
    assert.equal(e?.status, 401);
  }
});

test("auth middleware - valid token builds authCtx", async () => {
  const token = "token-abc";
  const session = { user: { id: "u1" }, sharedSessionToken: "shared1" };
  const sharedCoreClient = {
    getSession: async () => ({ user: { id: "u1", name: "Test User" } }),
    listWorkspaces: async () => [{ id: "workspace_home_001" }],
  };
  const middleware = createAuthMiddleware({
    sessionStore: { getByToken: (t) => (t === token ? session : null) },
    sharedCoreClient,
  });
  const req = makeReq(token);
  const authCtx = await middleware.authenticate(req);
  assert.ok(authCtx.user);
  assert.ok(Array.isArray(authCtx.workspaces));
  assert.ok(typeof authCtx.assertWorkspaceAccess === "function");
});
