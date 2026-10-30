import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = vi.hoisted(() => ({
  listScenes: vi.fn(),
  runScene: vi.fn(),
  listRuns: vi.fn(),
}));

vi.mock("./db/reality-repository", () => ({ ...repo }));
vi.mock("./db/auth-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/auth-repository")>()),
  isAuthSessionActive: vi.fn(async () => true),
}));

import app from "./index";

const withDb = { ENVIRONMENT: "test", DATABASE_URL: "postgres://example.local/db" };
const noDb = { ENVIRONMENT: "test" };
const OWNER = "local-test@omdala.invalid"; // the owner used outside release environments

const run = {
  run_id: "run_scene_1",
  source: "scene",
  source_id: "scene_sleep_child",
  actor_id: OWNER,
  status: "succeeded",
  policy_decision: "allow_with_logging",
  proof_id: "proof_1",
  created_at: "2026-10-30T00:00:00.000Z",
};

beforeEach(() => Object.values(repo).forEach((fn) => fn.mockReset()));

describe("persisted scenes and runs (database configured)", () => {
  it("lists scenes from the repository for the request owner", async () => {
    repo.listScenes.mockResolvedValueOnce([
      { scene_id: "scene_sleep_child", display_name: "Sleep", safety_class: "safe", actions: [], created_at: run.created_at },
    ]);
    const response = await app.request("http://localhost/v2/reality/scenes", {}, withDb);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { scenes: unknown[]; total: number } };
    expect(body.data.total).toBe(1);
    expect(repo.listScenes).toHaveBeenCalledWith(expect.objectContaining(withDb), OWNER);
  });

  it("runs a scene through the repository and keeps the response shape", async () => {
    repo.runScene.mockResolvedValueOnce(run);
    const response = await app.request(
      "http://localhost/v2/reality/scenes/scene_sleep_child/run",
      { method: "POST" },
      withDb,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: Record<string, unknown> };
    expect(body.data).toEqual({
      run_id: "run_scene_1",
      scene_id: "scene_sleep_child",
      status: "succeeded",
      proof: {
        proofId: "proof_1",
        runId: "run_scene_1",
        actorId: OWNER,
        policyDecision: "allow_with_logging",
        verifiedAt: run.created_at,
      },
    });
    expect(repo.runScene).toHaveBeenCalledWith(expect.anything(), OWNER, "scene_sleep_child");
  });

  it("answers 404 SCENE_NOT_FOUND when the scene is not in the caller's scope", async () => {
    repo.runScene.mockResolvedValueOnce(null);
    const response = await app.request(
      "http://localhost/v2/reality/scenes/scene_of_another_tenant/run",
      { method: "POST" },
      withDb,
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "SCENE_NOT_FOUND" } });
  });

  it("pages runs from the repository and reports hasNextPage", async () => {
    repo.listRuns.mockResolvedValueOnce({ runs: [run, { ...run, run_id: "run_scene_2" }], total: 5 });
    const response = await app.request("http://localhost/v2/reality/runs?page=2&limit=2", {}, withDb);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { runs: unknown[]; pagination: Record<string, unknown>; meta_pagination: Record<string, unknown> };
    };
    expect(repo.listRuns).toHaveBeenCalledWith(expect.anything(), OWNER, { page: 2, limit: 2 });
    expect(body.data.pagination).toEqual({ page: 2, limit: 2, total: 5, hasNextPage: true });
    expect(body.data.meta_pagination).toEqual(body.data.pagination);
  });

  it("reports no next page on the last page", async () => {
    repo.listRuns.mockResolvedValueOnce({ runs: [run], total: 5 });
    const response = await app.request("http://localhost/v2/reality/runs?page=3&limit=2", {}, withDb);
    const body = (await response.json()) as { data: { pagination: { hasNextPage: boolean } } };
    expect(body.data.pagination.hasNextPage).toBe(false);
  });

  it("maps a database outage to 503 DATABASE_UNAVAILABLE", async () => {
    const { DbQueryError } = await import("./db/errors");
    repo.listScenes.mockRejectedValueOnce(
      new DbQueryError({ kind: "unavailable", message: "ECONNREFUSED", sqlState: "08006", operation: "listScenes" }),
    );
    const response = await app.request("http://localhost/v2/reality/scenes", {}, withDb);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "DATABASE_UNAVAILABLE" } });
  });
});

describe("in-memory fallback (no database, local/test only)", () => {
  it("never calls the repository", async () => {
    const scenes = await app.request("http://localhost/v2/reality/scenes", {}, noDb);
    expect(scenes.status).toBe(200);
    const run = await app.request(
      "http://localhost/v2/reality/scenes/scene_sleep_child/run",
      { method: "POST" },
      noDb,
    );
    expect(run.status).toBe(200);
    const runs = await app.request("http://localhost/v2/reality/runs", {}, noDb);
    expect(runs.status).toBe(200);
    for (const fn of Object.values(repo)) expect(fn).not.toHaveBeenCalled();
  });

  it("still answers 404 for an unknown scene", async () => {
    const response = await app.request(
      "http://localhost/v2/reality/scenes/nope/run",
      { method: "POST" },
      noDb,
    );
    expect(response.status).toBe(404);
  });
});

describe("release boundary stays closed", () => {
  it.each([
    ["GET", "/v2/reality/scenes"],
    ["POST", "/v2/reality/scenes/scene_sleep_child/run"],
    ["GET", "/v2/reality/runs"],
  ])("%s %s is 501 in production and staging without touching the repository", async (method, path) => {
    for (const environment of ["production", "staging"]) {
      const env = { ENVIRONMENT: environment, DATABASE_URL: "postgres://example.local/db", MAGIC_LINK_SECRET: "x".repeat(40) };
      const part = Buffer.from(
        JSON.stringify({
          jti: "11111111-1111-4111-8111-111111111111",
          sid: "22222222-2222-4222-8222-222222222222",
          email: "tenant@omdala.com",
          type: "access",
          exp: Date.now() + 60_000,
        }),
      ).toString("base64url");
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.MAGIC_LINK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(part));
      const cookie = `omdala_access_token=${part}.${Buffer.from(new Uint8Array(sig)).toString("base64url")}`;
      const response = await app.request(`http://localhost${path}`, { method, headers: { cookie } }, env);
      expect(response.status).toBe(501);
    }
    for (const fn of Object.values(repo)) expect(fn).not.toHaveBeenCalled();
  });
});
