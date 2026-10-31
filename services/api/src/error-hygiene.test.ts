// WO-T2-28: a 5xx body carries a stable code, a fixed sentence and the request id, never driver,
// provider or stack text. The cause is logged with the same request id.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./db/auth-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/auth-repository")>()),
  isAuthSessionActive: vi.fn(async () => true),
}));
// every statement fails with text that must never reach a client
const POISON = "postgres://svc:hunter2@10.1.2.3:5432/omdala ECONNREFUSED at Object.<anonymous> (/srv/app/dist/index.js:1:1)";
vi.mock("./db/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/client")>()),
  queryRows: vi.fn(async () => {
    throw new Error(POISON);
  }),
}));

import app from "./index";

const SECRET = "test_error_hygiene_secret_value_0123456789";
const FORBIDDEN = ["hunter2", "10.1.2.3", "ECONNREFUSED", "Object.<anonymous>", "/srv/app", "postgres://", "at Object", "node_modules"];

async function cookie(email = "hygiene@example.test") {
  const part = Buffer.from(JSON.stringify({ jti: crypto.randomUUID(), sid: crypto.randomUUID(), email, type: "access", exp: Date.now() + 3_600_000 })).toString("base64url");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = Buffer.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(part)))).toString("base64url");
  return `omdala_access_token=${part}.${sig}`;
}
const db = { ENVIRONMENT: "production", DATABASE_URL: "postgres://example.local/db", MAGIC_LINK_SECRET: SECRET };
const local = { ENVIRONMENT: "test", MAGIC_LINK_SECRET: SECRET };
const send = async (method: string, path: string, env: Record<string, unknown>, body?: unknown, headers: Record<string, string> = {}) =>
  app.request(`http://localhost${path}`, { method, headers: { "content-type": "application/json", ...headers }, body: body === undefined ? undefined : JSON.stringify(body) }, env);

async function expectClean(response: Response, logged?: { mock: { calls: unknown[][] } }) {
  const text = await response.text();
  for (const needle of FORBIDDEN) expect(text, `${response.status} body leaks ${needle}`).not.toContain(needle);
  const body = JSON.parse(text) as { ok: boolean; error: { code: string; message: string }; meta?: { requestId?: string } };
  expect(body.ok).toBe(false);
  expect(Object.keys(body.error).sort()).toEqual(["code", "message"]);
  expect(body.error.code).toMatch(/^[A-Za-z0-9_]+$/);
  expect(body.error.message.length).toBeLessThan(160);
  expect(body.meta?.requestId).toMatch(/^[0-9a-f-]{8,}$/i);
  if (logged) expect(JSON.stringify(logged.mock.calls)).toContain(body.meta!.requestId!); // the cause is findable by request id
  return body;
}

afterEach(() => vi.restoreAllMocks());

describe("5xx bodies are stable", () => {
  it("an error nobody caught answers internal_error with the request id and logs the cause", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    // the logout handler logs after revoking, outside its try block: a throw there is uncaught
    vi.spyOn(console, "log").mockImplementation(() => {
      throw new Error(POISON);
    });
    const response = await send("POST", "/v1/auth/logout", local);
    expect(response.status).toBe(500);
    const body = await expectClean(response, logged);
    expect(body.error.code).toBe("internal_error");
    expect(JSON.stringify(logged.mock.calls)).toContain("hunter2"); // the log keeps the cause
  });

  it("mail delivery failures (contact and access request) hide the transport error", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error(POISON));
    const env = { ENVIRONMENT: "staging", MAGIC_LINK_SECRET: SECRET, MAIL_API_KEY: "k" };
    for (const [path, body] of [
      ["/v1/contact", { name: "N", email: "n@example.test", message: "hello" }],
      ["/v1/auth/access-request", { email: "a@example.test", role: "operator", nodeName: "Node", note: "hello" }],
    ] as const) {
      const response = await send("POST", path, env, body, { "cf-connecting-ip": `203.0.113.${path.length}` });
      expect(response.status, path).toBeGreaterThanOrEqual(500);
      const out = await expectClean(response, logged);
      expect(out.error.code).toBe("mail_delivery_failed");
    }
  });

  it("database failures on account, billing, workspace, notification and analytics routes", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const headers = { cookie: await cookie() };
    const routes: [string, string, unknown?][] = [
      ["GET", "/v1/account/profile"],
      ["PUT", "/v1/account/profile", { displayName: "x" }],
      ["GET", "/v1/account/preferences"],
      ["PUT", "/v1/account/preferences", { theme: "dark" }],
      ["GET", "/v1/billing/subscriptions"],
      ["GET", "/v1/billing/usage"],
      ["GET", "/v1/workspaces"],
      ["GET", "/v1/workspaces/ws_x"],
      ["POST", "/v1/workspaces", { name: "W", type: "family" }],
      ["GET", "/v1/notifications"],
      ["POST", "/v1/notifications/mark-read/n1", {}],
      ["POST", "/v1/analytics/track", { appId: "om-ai", eventName: "e", source: "web" }],
      ["GET", "/v1/analytics/dashboard"],
    ];
    let checked = 0;
    for (const [method, path, body] of routes) {
      const response = await send(method, path, db, body, headers);
      if (response.status < 500) continue; // a route may answer a 4xx before it reaches the store
      await expectClean(response, logged);
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(10);
  });

  it("session store and auth storage failures", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const noSession = await send("POST", "/v1/auth/magic-link/request", db, { email: "a@example.test", redirectTo: "/" });
    expect(noSession.status).toBeGreaterThanOrEqual(500);
    await expectClean(noSession, logged);
    const refresh = await send("POST", "/v1/auth/refresh", db, undefined, { cookie: "omdala_refresh_token=bogus" });
    expect(refresh.status).toBeLessThan(500);
  });

  it("the chat path (ledger unreachable) answers a stable code", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const env = { ...db, OMDALA_AI_DAILY_COST_CAP_USD: "5", AIAGENT_API_URL: "https://api.aiagent.iai.one", AIAGENT_WORKSPACE_ID: "omdala-com-production", AIAGENT_API_KEY: `sk-aiagent-${"a".repeat(48)}` };
    const response = await send("POST", "/v1/ai/chat", env, { model: "iai-one/iris-7", messages: [{ role: "user", content: "hi" }], maxTokens: 32 }, { cookie: await cookie(), "idempotency-key": "idem-key-hygiene-abcdefgh" });
    expect(response.status).toBeGreaterThanOrEqual(500);
    await expectClean(response, logged);
  });

  it("the reality routes keep their stable mapping under a failing store", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const headers = { cookie: await cookie() };
    const response = await send("GET", "/v2/reality/nodes", db, undefined, headers);
    if (response.status >= 500) await expectClean(response, logged);
    else expect(response.status).toBeLessThan(500);
  });
});
