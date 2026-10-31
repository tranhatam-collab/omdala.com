import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResourceAccessError } from "./db/errors";

const repo = vi.hoisted(() => ({
  createCommitment: vi.fn(),
  createProof: vi.fn(),
  getTrustByNodeId: vi.fn(),
  listCommitments: vi.fn(),
  listNodes: vi.fn(),
  listProofs: vi.fn(),
  listStates: vi.fn(),
  listTransitions: vi.fn(),
  listTrust: vi.fn(),
}));

vi.mock("./db/reality-repository", () => ({ ...repo }));
vi.mock("./db/auth-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/auth-repository")>()),
  isAuthSessionActive: vi.fn(async () => true),
}));

import app from "./index";

const SECRET = "test_reality_tenant_isolation_secret";
const production = {
  ENVIRONMENT: "production",
  DATABASE_URL: "postgres://example.local/db",
  MAGIC_LINK_SECRET: SECRET,
};
const local = { ENVIRONMENT: "test", DATABASE_URL: "postgres://example.local/db" };

async function cookieFor(email: string) {
  const part = Buffer.from(
    JSON.stringify({
      jti: "11111111-1111-4111-8111-111111111111",
      sid: "22222222-2222-4222-8222-222222222222",
      email,
      type: "access",
      exp: Date.now() + 60 * 60 * 1000,
    }),
  ).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(part));
  return `omdala_access_token=${part}.${Buffer.from(new Uint8Array(sig)).toString("base64url")}`;
}

const A = "tenant-a@omdala.com";
const B = "tenant-b@omdala.com";

// Every /v2/reality route except the unauthenticated health probe.
const routes: Array<{ method: "GET" | "POST"; path: string; body?: unknown; released: boolean }> = [
  { method: "GET", path: "/v2/reality/nodes", released: true },
  { method: "GET", path: "/v2/reality/proofs", released: true },
  { method: "GET", path: "/v2/reality/trust", released: true },
  { method: "GET", path: "/v2/reality/trust/node_a1", released: true },
  { method: "GET", path: "/v2/reality/states", released: false },
  { method: "GET", path: "/v2/reality/commitments", released: false },
  { method: "POST", path: "/v2/reality/commitments", body: { fromNodeId: "node_a1", toNodeId: "node_a2", title: "t", summary: "s" }, released: false },
  { method: "GET", path: "/v2/reality/transitions", released: false },
  { method: "POST", path: "/v2/reality/proofs", body: { type: "document", summary: "s", commitmentId: "commitment_a" }, released: false },
  { method: "GET", path: "/v2/reality/scenes", released: false },
  { method: "POST", path: "/v2/reality/scenes/scene_1/run", body: {}, released: false },
  { method: "GET", path: "/v2/reality/runs", released: false },
];

const call = (route: (typeof routes)[number], cookie: string | undefined, env: object) =>
  app.request(
    `http://localhost${route.path}`,
    {
      method: route.method,
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(route.body ? { "content-type": "application/json" } : {}),
      },
      ...(route.body ? { body: JSON.stringify(route.body) } : {}),
    },
    env,
  );

beforeEach(() => {
  Object.values(repo).forEach((fn) => fn.mockReset());
  repo.listNodes.mockResolvedValue([]);
  repo.listProofs.mockResolvedValue([]);
  repo.listTrust.mockResolvedValue([]);
  repo.getTrustByNodeId.mockResolvedValue(null);
});

describe("/v2/reality without a session in a release environment", () => {
  it.each(routes)("$method $path answers 401 and never reads data", async (route) => {
    const response = await call(route, undefined, production);
    expect(response.status).toBe(401);
    for (const fn of Object.values(repo)) expect(fn).not.toHaveBeenCalled();
  });
});

describe("/v2/reality tenant scoping in a release environment", () => {
  it.each(routes.filter((r) => !r.released))(
    "$method $path is closed for tenant B and does not reach the repository",
    async (route) => {
      const response = await call(route, await cookieFor(B), production);
      expect(response.status).toBe(501);
      await expect(response.json()).resolves.toMatchObject({
        error: { code: "REALITY_ROUTE_NOT_RELEASED" },
      });
      for (const fn of Object.values(repo)) expect(fn).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["/v2/reality/nodes", "listNodes"],
    ["/v2/reality/proofs", "listProofs"],
    ["/v2/reality/trust", "listTrust"],
  ] as const)("GET %s reads only the caller's own scope (%s)", async (path, fn) => {
    const route = routes.find((r) => r.path === path)!;
    const response = await call(route, await cookieFor(B), production);
    expect(response.status).toBe(200);
    expect(repo[fn]).toHaveBeenCalledTimes(1);
    expect(repo[fn]).toHaveBeenCalledWith(expect.anything(), B);
    expect(repo[fn]).not.toHaveBeenCalledWith(expect.anything(), A);
  });

  it("GET /v2/reality/trust/:nodeId answers 404 for another tenant's node", async () => {
    // the repository scopes by owner and returns null for a foreign node
    const route = routes.find((r) => r.path === "/v2/reality/trust/node_a1")!;
    const response = await call(route, await cookieFor(B), production);
    expect(response.status).toBe(404);
    expect(repo.getTrustByNodeId).toHaveBeenCalledWith(expect.anything(), B, "node_a1");
    await expect(response.json()).resolves.toMatchObject({ error: { code: "TRUST_NOT_FOUND" } });
  });

  it("two tenants in a row never see each other's scope", async () => {
    const route = routes.find((r) => r.path === "/v2/reality/nodes")!;
    await call(route, await cookieFor(A), production);
    await call(route, await cookieFor(B), production);
    expect(repo.listNodes.mock.calls.map((c) => c[1])).toEqual([A, B]);
  });
});

describe("/v2/reality write routes map cross-tenant references to 404", () => {
  it("POST /v2/reality/commitments with another tenant's nodes", async () => {
    repo.createCommitment.mockRejectedValueOnce(new ResourceAccessError("nodes not in scope"));
    const route = routes.find((r) => r.method === "POST" && r.path.endsWith("/commitments"))!;
    const response = await call(route, undefined, local);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "RESOURCE_NOT_FOUND" } });
  });

  it("POST /v2/reality/proofs against another tenant's commitment", async () => {
    repo.createProof.mockRejectedValueOnce(new ResourceAccessError("commitment not in scope"));
    const route = routes.find((r) => r.method === "POST" && r.path.endsWith("/proofs"))!;
    const response = await call(route, undefined, local);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "RESOURCE_NOT_FOUND" } });
  });
});
