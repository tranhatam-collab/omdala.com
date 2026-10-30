import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DbQueryError } from "./db/errors";

const auth = vi.hoisted(() => ({
  registerMagicLink: vi.fn(),
  consumeMagicLink: vi.fn(),
  createAuthSession: vi.fn(),
  rotateAuthSession: vi.fn(),
  revokeAuthSession: vi.fn(),
  isAuthSessionActive: vi.fn(),
}));
vi.mock("./db/auth-repository", () => ({ ...auth }));

const runtime = vi.hoisted(() => ({
  readOrCreateAccountProfile: vi.fn(),
}));
vi.mock("./db/account-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/account-repository")>()),
  ...runtime,
}));

import app from "./index";

const SECRET = "test_failure_states_secret_at_least_32_chars";
const dbEnv = {
  ENVIRONMENT: "production",
  MAGIC_LINK_SECRET: SECRET,
  DATABASE_URL: "postgres://example.local/db",
};
const unavailable = () =>
  new DbQueryError({
    kind: "unavailable",
    message: "connect ECONNREFUSED 10.0.0.5:5432 password=hunter2",
    sqlState: "08006",
    operation: "test",
  });

async function sign(payload: object) {
  const part = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(part));
  return `${part}.${Buffer.from(new Uint8Array(sig)).toString("base64url")}`;
}
const accessCookie = async () =>
  `omdala_access_token=${await sign({
    jti: crypto.randomUUID(),
    sid: crypto.randomUUID(),
    email: "owner@omdala.com",
    type: "access",
    exp: Date.now() + 60_000,
  })}`;
const magicToken = () =>
  sign({
    jti: crypto.randomUUID(),
    email: "owner@omdala.com",
    redirectTo: "/profile",
    exp: Date.now() + 60_000,
  });

const post = (path: string, body: unknown, env: object, headers: Record<string, string> = {}) =>
  app.request(
    `http://localhost${path}`,
    { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) },
    env,
  );

beforeEach(() => {
  Object.values(auth).forEach((fn) => fn.mockReset());
  runtime.readOrCreateAccountProfile.mockReset();
  auth.isAuthSessionActive.mockResolvedValue(true);
});
afterEach(() => vi.restoreAllMocks());

async function expectStable503(response: Response) {
  expect(response.status).toBe(503);
  const text = await response.text();
  expect(JSON.parse(text)).toMatchObject({ ok: false, error: { code: "DATABASE_UNAVAILABLE" } });
  // the driver message (host, port, credentials) must never reach the client
  expect(text).not.toMatch(/ECONNREFUSED|10\.0\.0\.5|hunter2|password/);
}

describe("database unavailable gives 503 DATABASE_UNAVAILABLE", () => {
  it("on the magic-link request", async () => {
    auth.registerMagicLink.mockRejectedValue(unavailable());
    await expectStable503(await post("/v1/auth/magic-link/request", { email: "owner@omdala.com" }, dbEnv));
  });

  it("on the session exchange", async () => {
    auth.consumeMagicLink.mockRejectedValue(unavailable());
    await expectStable503(
      await post("/v1/auth/session/exchange", { token: await magicToken() }, dbEnv),
    );
  });

  it("on the session exchange when creating the session fails", async () => {
    auth.consumeMagicLink.mockResolvedValue(true);
    auth.createAuthSession.mockRejectedValue(unavailable());
    const response = await post("/v1/auth/session/exchange", { token: await magicToken() }, dbEnv);
    await expectStable503(response);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("on refresh", async () => {
    auth.rotateAuthSession.mockRejectedValue(unavailable());
    const refresh = await sign({
      jti: crypto.randomUUID(),
      sid: crypto.randomUUID(),
      email: "owner@omdala.com",
      type: "refresh",
      exp: Date.now() + 60_000,
    });
    const response = await app.request(
      "http://localhost/v1/auth/refresh",
      { method: "POST", headers: { cookie: `omdala_refresh_token=${refresh}` } },
      dbEnv,
    );
    await expectStable503(response);
  });

  it("on a protected account route", async () => {
    runtime.readOrCreateAccountProfile.mockRejectedValue(unavailable());
    const response = await app.request(
      "http://localhost/v1/account/profile",
      { headers: { cookie: await accessCookie() } },
      dbEnv,
    );
    await expectStable503(response);
  });

  it("is a 503 session_authority_unavailable when the session store is down", async () => {
    auth.isAuthSessionActive.mockRejectedValue(unavailable());
    const response = await app.request(
      "http://localhost/v1/auth/session",
      { headers: { cookie: await accessCookie() } },
      dbEnv,
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "session_authority_unavailable" },
    });
  });

  it("is a 504 DATABASE_TIMEOUT on a statement timeout", async () => {
    auth.consumeMagicLink.mockRejectedValue(
      new DbQueryError({ kind: "timeout", message: "statement timeout", sqlState: "57014", operation: "test" }),
    );
    const response = await post("/v1/auth/session/exchange", { token: await magicToken() }, dbEnv);
    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "DATABASE_TIMEOUT" } });
  });

  it("is a 503 PERSISTENCE_REQUIRED when no database is configured", async () => {
    auth.registerMagicLink.mockRejectedValue(new Error("DATABASE_URL is not configured"));
    const response = await post(
      "/v1/auth/magic-link/request",
      { email: "owner@omdala.com" },
      { ENVIRONMENT: "production", MAGIC_LINK_SECRET: SECRET },
    );
    expect(response.status).toBe(503);
    const text = await response.text();
    expect(text).toContain("PERSISTENCE_REQUIRED");
    expect(text).not.toContain("DATABASE_URL");
  });
});

describe("mail failures are explicit errors, never a false success", { timeout: 30_000 }, () => {
  const mailEnv = {
    ENVIRONMENT: "staging",
    MAGIC_LINK_SECRET: SECRET,
    APP_BASE_URL: "https://app-staging.omdala.com",
    AUTH_BASE_URL: "https://auth-staging.omdala.com",
    WEB_BASE_URL: "https://staging.omdala.com",
    MAIL_API_KEY: "test-mail-key",
    MAIL_API_URL: "https://mail.example.invalid",
    MAIL_API_WORKSPACE_ID: "omdala.com-staging",
    MAIL_DELIVERY_MODE: "sink",
    MAIL_STAGING_SINK_ADDRESS: "staging-sink@omdala.com",
    DATABASE_URL: "postgres://example.local/db",
  };
  const requests: Array<[string, Record<string, unknown>]> = [
    ["/v1/contact", { name: "N", email: "n@example.com", message: "hello" }],
    ["/v1/auth/access-request", { email: "n@example.com", role: "owner", nodeName: "Node" }],
    ["/v1/auth/magic-link/request", { email: "n@example.com" }],
  ];

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    auth.registerMagicLink.mockResolvedValue(undefined);
  });
  afterEach(async () => {
    // The sibling mail of a failed Promise.all keeps retrying; let it finish
    // against this test's fetch spy before the spy is restored.
    // A retry chain always has a pending back-off timer or an in-flight request, so
    // "no pending timer for several consecutive turns" means every sibling is done.
    let quiet = 0;
    for (let i = 0; i < 4_000 && quiet < 25; i++) {
      await vi.advanceTimersByTimeAsync(500);
      await new Promise<void>((resolve) => setImmediate(resolve));
      quiet = vi.getTimerCount() === 0 ? quiet + 1 : 0;
    }
    expect(vi.getTimerCount()).toBe(0);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const respondWith = (make: () => Response | Promise<Response>) =>
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => make());

  let caller = 0;
  let lastToken = "";
  // Unique email, IP and token per call: the rate limiter never interferes, and each
  // test can pick out its own provider calls even if a failed mail's sibling from an
  // earlier test fires late (its first fetch waits on thread-pool crypto work).
  const fresh = (body: Record<string, unknown>, sink = true) => {
    caller += 1;
    lastToken = `tok${caller}x${Math.random().toString(36).slice(2, 8)}`;
    const tag = (value: unknown, fallback: string) => `${typeof value === "string" ? value : fallback} ${lastToken}`;
    const tagged: Record<string, unknown> = { ...body, email: `caller-${caller}@example.com` };
    for (const field of ["name", "message", "role", "nodeName"]) {
      if (field in body) tagged[field] = tag(body[field], field);
    }
    return {
      body: tagged,
      env: sink ? mailEnv : { ...mailEnv, MAIL_STAGING_SINK_ADDRESS: undefined },
      headers: { "x-forwarded-for": `203.0.113.${caller}` },
    };
  };
  const ownCalls = (spy: { mock: { calls: unknown[][] } }) =>
    spy.mock.calls.filter(([, init]) => String((init as RequestInit | undefined)?.body ?? "").includes(lastToken));

  // Advance the fake clock through retry back-off until the response settles.
  async function settle(pending: Promise<Response>): Promise<Response> {
    let done = false;
    const result = pending.finally(() => {
      done = true;
    });
    // setImmediate is not faked, so each pass also gives real stream I/O a turn.
    for (let i = 0; i < 5_000 && !done; i++) {
      await vi.advanceTimersByTimeAsync(250);
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
    return result;
  }

  async function run(path: string, body: Record<string, unknown>, sink = true) {
    const request = fresh(body, sink);
    return settle(Promise.resolve(post(path, request.body, request.env, request.headers)));
  }

  it.each(requests)("%s answers 502 mail_delivery_failed on provider 5xx (after retries)", async (path, body) => {
    const fetchSpy = respondWith(() => new Response("boom", { status: 503 }));
    const response = await run(path, body);
    expect(response.status).toBe(502);
    const json = (await response.json()) as { ok: boolean; error?: { code: string }; data?: unknown };
    expect(json.ok).toBe(false);
    expect(json.data).toBeUndefined();
    expect(["mail_delivery_failed", "magic_link_failed"]).toContain(json.error?.code);
    expect(fetchSpy).toHaveBeenCalled();
  });

  it.each(requests)("%s answers 502 on provider 4xx without retrying", async (path, body) => {
    const fetchSpy = respondWith(() => new Response("denied", { status: 401 }));
    const response = await run(path, body);
    expect(response.status).toBe(502);
    expect(((await response.json()) as { ok: boolean }).ok).toBe(false);
    // no back-off retries: at most one provider call per outbound mail
    const own = ownCalls(fetchSpy);
    expect(own.length, `${own.length} calls for ${lastToken}`).toBeLessThanOrEqual(2);
  });

  it.each(requests)("%s answers 502 when the provider accepts without a message id", async (path, body) => {
    respondWith(() => new Response("{}", { status: 202, headers: { "content-type": "application/json" } }));
    const response = await run(path, body);
    expect(response.status).toBe(502);
    expect(((await response.json()) as { ok: boolean }).ok).toBe(false);
  });

  it.each(requests)("%s answers 502 on a network failure", async (path, body) => {
    respondWith(() => {
      throw new TypeError("fetch failed");
    });
    const response = await run(path, body);
    expect(response.status).toBe(502);
    expect(((await response.json()) as { ok: boolean }).ok).toBe(false);
  });

  it.each(requests)("%s answers 502 when the sink address is missing in staging", async (path, body) => {
    const fetchSpy = respondWith(() => new Response("{}", { status: 200 }));
    const response = await run(path, body, false);
    expect(response.status).toBe(502);
    expect(ownCalls(fetchSpy)).toHaveLength(0);
  });

  it.each(requests)("%s succeeds only with a provider receipt", async (path, body) => {
    respondWith(
      () =>
        new Response("{}", {
          status: 202,
          headers: { "content-type": "application/json", "x-message-id": "msg-123" },
        }),
    );
    const response = await run(path, body);
    expect([200, 201]).toContain(response.status);
    expect(await response.text()).toContain("msg-123");
  });
});
