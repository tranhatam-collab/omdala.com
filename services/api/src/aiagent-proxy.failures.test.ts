import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./db/auth-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/auth-repository")>()),
  isAuthSessionActive: vi.fn(async () => true),
}));

vi.mock("./db/ai-usage-repository", () => ({
  reserveAiUsage: vi.fn(async () => ({ outcome: "reserved" })),
  settleAiUsage: vi.fn(async () => true),
  releaseAiUsage: vi.fn(async () => true),
}));
vi.mock("./db/runtime-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/runtime-repository")>()),
  readOrCreateBillingSubscription: vi.fn(async () => ({ id: "sub_x", appId: "om-ai", planId: "free", status: "active", billingCycle: "monthly" })),
}));

import app from "./index";

const env = {
  ENVIRONMENT: "production",
  DATABASE_URL: "postgres://example.local/db",
  OMDALA_AI_DAILY_COST_CAP_USD: "10",
  MAGIC_LINK_SECRET: "test_magic_secret_for_aiagent_failure_routes",
  AIAGENT_API_URL: "https://api.aiagent.iai.one",
  AIAGENT_WORKSPACE_ID: "omdala-com-production",
  AIAGENT_API_KEY: `sk-aiagent-${"a".repeat(48)}`,
};
const MODEL = "iai-one/iris-7";

async function accessCookie(email: string) {
  const payloadPart = Buffer.from(
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
    new TextEncoder().encode(env.MAGIC_LINK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadPart));
  return `omdala_access_token=${payloadPart}.${Buffer.from(new Uint8Array(signature)).toString("base64url")}`;
}

const catalog = () =>
  new Response(
    JSON.stringify({
      ok: true,
      contract_version: "1.0.0",
      data: {
        authority: "aiagent.iai.one",
        transport_origin: "https://api.aiagent.iai.one",
        namespace: "iai-one",
        count: 1,
        models: [{ id: MODEL, capabilities: ["chat"], status: "available" }],
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Provider-Contract-Version": "1.0.0" },
    },
  );

// Catalog succeeds, then the chat call produces `chat`.
function mockChat(chat: () => Response | Promise<Response>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (request) => {
    const url = new URL(typeof request === "string" ? request : request instanceof URL ? request.href : request.url);
    if (url.origin !== "https://api.aiagent.iai.one") throw new Error("blocked origin");
    if (url.pathname === "/v1/ai/models") return catalog();
    if (url.pathname === "/v1/ai/chat") return chat();
    throw new Error(`unexpected path ${url.pathname}`);
  });
}

let counter = 0;
async function chatRequest() {
  // unique user per call so the per-user rate limiter never interferes
  const cookie = await accessCookie(`failure-${counter++}@omdala.com`);
  return app.request(
    "http://localhost/v1/ai/chat",
    {
      method: "POST",
      headers: { "content-type": "application/json", cookie, "idempotency-key": `idem-${counter}-abcdefgh` },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: "hi" }], maxTokens: 32 }),
    },
    env,
  );
}

const providerFail = (status: number, headers: Record<string, string> = {}) =>
  new Response("{}", { status, headers: { "Content-Type": "application/json", ...headers } });

afterEach(() => vi.restoreAllMocks());

describe("AIAGENT chat route failure mapping", () => {
  it("answers 429 with a stable code and passes Retry-After through", async () => {
    mockChat(() => providerFail(429, { "Retry-After": "42" }));
    const response = await chatRequest();
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "aiagent_quota_exceeded" },
    });
  });

  it("answers 429 without Retry-After when the provider sent none or garbage", async () => {
    const variants: Array<Record<string, string>> = [{}, { "Retry-After": "later" }];
    for (const headers of variants) {
      mockChat(() => providerFail(429, headers));
      const response = await chatRequest();
      expect(response.status).toBe(429);
      expect(response.headers.get("retry-after")).toBeNull();
      vi.restoreAllMocks();
    }
  });

  it("clamps an absurd Retry-After", async () => {
    mockChat(() => providerFail(429, { "Retry-After": "999999999" }));
    expect((await chatRequest()).headers.get("retry-after")).toBe("86400");
  });

  it.each([500, 502, 503, 504])("keeps provider %s as 502", async (status) => {
    mockChat(() => providerFail(status, { "Retry-After": "5" }));
    const response = await chatRequest();
    expect(response.status).toBe(502);
    expect(response.headers.get("retry-after")).toBeNull();
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "aiagent_reconciliation_failed" },
    });
  });

  it("answers 504 with a stable code when the provider times out", async () => {
    mockChat(() => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    const response = await chatRequest();
    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "aiagent_timeout" },
    });
  });

  it("keeps other network failures as 502", async () => {
    mockChat(() => {
      throw new TypeError("fetch failed");
    });
    expect((await chatRequest()).status).toBe(502);
  });

  it("never echoes provider bodies or the credential in error responses", async () => {
    mockChat(() =>
      new Response('{"error":"sk-aiagent-leak"}', {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const text = await (await chatRequest()).text();
    expect(text).not.toContain("sk-aiagent");
  });
});

async function modelsRequest(testEnv: Record<string, string> = env) {
  const cookie = await accessCookie(`models-${counter++}@omdala.com`);
  return app.request("http://localhost/v1/ai/models", { headers: { cookie } }, testEnv);
}

describe("AIAGENT models route failure mapping", () => {
  it("answers 429 with a stable code and passes Retry-After through", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(providerFail(429, { "Retry-After": "17" }));
    const response = await modelsRequest();
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("17");
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "aiagent_quota_exceeded" },
    });
  });

  it("drops a garbage Retry-After and clamps an absurd one", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockResolvedValueOnce(providerFail(429, { "Retry-After": "soon" }));
    expect((await modelsRequest()).headers.get("retry-after")).toBeNull();
    fetchSpy.mockResolvedValueOnce(providerFail(429, { "Retry-After": "999999999" }));
    expect((await modelsRequest()).headers.get("retry-after")).toBe("86400");
  });

  it("answers 504 with a stable code on a provider timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("The operation timed out.", "TimeoutError"),
    );
    const response = await modelsRequest();
    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "aiagent_timeout" } });
  });

  it.each([500, 502, 503, 504, 401, 403])("answers 502 when the provider returns %s", async (status) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(providerFail(status));
    const response = await modelsRequest();
    expect(response.status).toBe(502);
    expect(response.headers.get("retry-after")).toBeNull();
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "aiagent_catalog_unavailable" },
    });
  });

  it("keeps 503 for failures that are not provider responses", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await modelsRequest()).status).toBe(503);
    fetchSpy.mockResolvedValueOnce(
      new Response("<html></html>", { status: 200, headers: { "Content-Type": "text/html" } }),
    );
    expect((await modelsRequest()).status).toBe(503);
  });

  it("keeps 503 and never calls the provider when AIAGENT is not configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await modelsRequest({ ...env, AIAGENT_API_KEY: "" });
    expect(response.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("never echoes provider bodies or the credential", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"error":"sk-aiagent-leak"}', { status: 429, headers: { "Content-Type": "application/json" } }),
    );
    expect(await (await modelsRequest()).text()).not.toContain("sk-aiagent");
  });
});
