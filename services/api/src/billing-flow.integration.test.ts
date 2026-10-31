// WO-T2-25: the billing flow on real PostgreSQL. What is real: the subscription row, its CHECK
// constraints, the lazy default, the 402 the AI path answers for cancelled and past-due plans.
// What does not exist (a provider webhook receiver, plan-change routes) is pinned as a gap:
// no request a user can make changes plan or status. Skipped unless OMDALA_TEST_DATABASE_URL
// names a disposable server.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// The route runs as ENVIRONMENT=production (the only environment with an AIAGENT identity), and
// production refuses the insecure-TLS flag the throwaway server needs. Only the connection
// setting changes here: every statement still runs on the real server.
vi.mock("./db/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db/client")>();
  return {
    ...original,
    queryRows: ((env: Parameters<typeof original.queryRows>[0], text: string, params?: unknown[]) =>
      original.queryRows({ ...env, ENVIRONMENT: "test" }, text, params)) as typeof original.queryRows,
  };
});

import app from "./index";
import { MODEL, cookieFor, installProvider, providerCalls } from "./ai-chat-test-support";

const adminUrl = process.env.OMDALA_TEST_DATABASE_URL;
const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../infra/postgres/migrations");
const sqlFiles = (dir: string) =>
  existsSync(dir) ? readdirSync(dir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).sort().map((n) => resolve(dir, n)) : [];
const appliedOrder = [...sqlFiles(root), ...sqlFiles(resolve(root, "proposed"))].sort((a, b) =>
  a.split("/").pop()!.localeCompare(b.split("/").pop()!),
);
const SECRET = "test_billing_flow_secret_value_0123456789";

describe.skipIf(!adminUrl)("billing flow on real PostgreSQL", () => {
  const dbName = `omdala_billing_${randomBytes(6).toString("hex")}`;
  let admin: Client;
  let pg: Client;
  let env: Record<string, unknown>;
  let seq = 0;

  beforeAll(async () => {
    admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${dbName}`);
    const url = new URL(adminUrl!);
    url.pathname = `/${dbName}`;
    pg = new Client({ connectionString: url.toString() });
    await pg.connect();
    for (const file of appliedOrder) await pg.query(readFileSync(file, "utf8"));
    env = {
      ENVIRONMENT: "production",
      DATABASE_URL: url.toString(),
      OMDALA_DB_TLS_INSECURE: "1",
      OMDALA_AI_DAILY_COST_CAP_USD: "5",
      MAGIC_LINK_SECRET: SECRET,
      AIAGENT_API_URL: "https://api.aiagent.iai.one",
      AIAGENT_WORKSPACE_ID: "omdala-com-production",
      AIAGENT_API_KEY: `sk-aiagent-${"a".repeat(48)}`,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    providerCalls.chat = 0;
  });

  afterAll(async () => {
    await pg?.end().catch(() => undefined);
    await admin?.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`).catch(() => undefined);
    await admin?.end().catch(() => undefined);
  });

  async function account() {
    const email = `bill-${(seq += 1)}-${randomBytes(3).toString("hex")}@example.test`;
    const cookie = await cookieFor(SECRET, email);
    const payload = JSON.parse(Buffer.from(cookie.split("=")[1].split(".")[0], "base64url").toString()) as { sid: string };
    await pg.query(
      "INSERT INTO omdala.auth_sessions (id, email, current_refresh_jti, refresh_expires_at) VALUES ($1::uuid, $2, $3::uuid, NOW() + interval '1 day')",
      [payload.sid, email, crypto.randomUUID()],
    );
    return { email, cookie };
  }
  const call = (cookie: string, method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
    app.request(
      `http://localhost${path}`,
      {
        method,
        headers: { "content-type": "application/json", cookie, ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      env,
    );
  const chat = (cookie: string, key: string) =>
    call(cookie, "POST", "/v1/ai/chat", { model: MODEL, messages: [{ role: "user", content: "hi" }], maxTokens: 32 }, { "idempotency-key": key });
  const rows = async (email: string) =>
    (await pg.query("SELECT id, plan_id, status, billing_cycle, app_id FROM omdala.billing_subscriptions WHERE owner_email=$1", [email])).rows;
  const ledgerRows = async (email: string) =>
    Number((await pg.query("SELECT COUNT(*) AS n FROM omdala.ai_usage_ledger WHERE owner_email=$1", [email])).rows[0].n);
  const errorCode = async (r: Response) => ((await r.json()) as { error: { code: string } }).error.code;

  it("creates the free/active/monthly default on first read, once, and serves it", async () => {
    const { email, cookie } = await account();
    expect(await rows(email)).toEqual([]);
    const first = await call(cookie, "GET", "/v1/billing/subscriptions");
    expect(first.status).toBe(200);
    const body = (await first.json()) as { data: { primary: { planId: string; status: string; billingCycle: string } } };
    expect(body.data.primary).toMatchObject({ planId: "om-ai-free", status: "active", billingCycle: "monthly" });
    await call(cookie, "GET", "/v1/billing/subscriptions");
    await call(cookie, "GET", "/v1/billing/usage");
    const stored = await rows(email);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ status: "active", billing_cycle: "monthly", app_id: "om-ai" });
  });

  it("no request a user can make changes the plan or the status", async () => {
    const { email, cookie } = await account();
    await call(cookie, "GET", "/v1/billing/subscriptions");
    const before = await rows(email);
    const planFields = { planId: "om-ai-pro", plan_id: "om-ai-pro", plan: "pro", status: "active", billingCycle: "yearly", subscription: { planId: "om-ai-pro", status: "active" } };
    const attempts: [string, string, unknown][] = [];
    for (const method of ["PUT", "POST", "PATCH", "DELETE"]) {
      for (const path of ["/v1/billing/subscriptions", "/v1/billing/subscriptions/sub_x", "/v1/billing/plan", "/v1/billing/checkout", "/v1/billing/upgrade", "/v1/billing/usage"]) {
        attempts.push([method, path, planFields]);
      }
    }
    attempts.push(
      ["PUT", "/v1/account/profile", { displayName: "x", ...planFields }],
      ["PUT", "/v1/account/preferences", { theme: "dark", ...planFields }],
      ["POST", "/v1/workspaces", { name: "ws", type: "family", ...planFields }],
      ["POST", "/v1/analytics/track", { appId: "om-ai", eventName: "billing.plan.changed", source: "web", properties: planFields }],
      ["POST", "/v1/analytics/track", { appId: "om-ai", eventName: "om-ai.subscription.upgraded", source: "web", properties: planFields }],
      ["POST", "/v1/security/api-keys", { name: "k", scopes: ["billing:write"] }],
    );
    for (const [method, path, body] of attempts) {
      const response = await call(cookie, method, path, body);
      expect(response.status, `${method} ${path}`).not.toBeGreaterThanOrEqual(500);
    }
    expect(await rows(email)).toEqual(before);
  });

  it("the database refuses states outside the contract", async () => {
    const { email } = await account();
    const insert = (status: string, cycle: string, app: string, plan = "om-ai-free") =>
      pg.query(
        "INSERT INTO omdala.billing_subscriptions (id, owner_email, app_id, plan_id, status, billing_cycle) VALUES ($1, $2, $3, $4, $5, $6)",
        [`sub_${crypto.randomUUID()}`, email, app, plan, status, cycle],
      );
    await expect(insert("refunded", "monthly", "om-ai")).rejects.toThrow();
    await expect(insert("active", "weekly", "om-ai")).rejects.toThrow();
    await expect(insert("active", "monthly", "other-app")).rejects.toThrow();
    await insert("past_due", "yearly", "om-ai", "om-ai-pro");
    await expect(insert("active", "monthly", "om-ai")).rejects.toThrow(); // one subscription per account and app
  });

  it("answers 402 subscription_inactive on chat for cancelled and past_due, before reserving or calling the provider", async () => {
    installProvider();
    for (const status of ["cancelled", "past_due"]) {
      const { email, cookie } = await account();
      await call(cookie, "GET", "/v1/billing/subscriptions");
      await pg.query("UPDATE omdala.billing_subscriptions SET status=$2 WHERE owner_email=$1", [email, status]);
      const view = (await (await call(cookie, "GET", "/v1/billing/subscriptions")).json()) as { data: { primary: { status: string } } };
      expect(view.data.primary.status).toBe(status);
      const response = await chat(cookie, `idem-key-${status}-abcdefgh`);
      expect(response.status, status).toBe(402);
      expect(await errorCode(response)).toBe("subscription_inactive");
      expect(await ledgerRows(email)).toBe(0);
    }
    expect(providerCalls.chat).toBe(0);
  });

  it("lets active and trialing accounts through, and recovers when the status is restored", async () => {
    installProvider();
    const { email, cookie } = await account();
    await call(cookie, "GET", "/v1/billing/subscriptions");
    await pg.query("UPDATE omdala.billing_subscriptions SET status='cancelled' WHERE owner_email=$1", [email]);
    expect((await chat(cookie, "idem-key-before-abcdefgh")).status).toBe(402);
    for (const [status, key] of [["trialing", "idem-key-trial-abcdefgh"], ["active", "idem-key-active-abcdefgh"]]) {
      await pg.query("UPDATE omdala.billing_subscriptions SET status=$2 WHERE owner_email=$1", [email, status]);
      expect((await chat(cookie, key)).status, status).toBe(200);
    }
    expect(providerCalls.chat).toBe(2);
  });

  it("keeps accounts apart: one account's cancelled plan does not stop another", async () => {
    installProvider();
    const a = await account();
    const b = await account();
    await call(a.cookie, "GET", "/v1/billing/subscriptions");
    await pg.query("UPDATE omdala.billing_subscriptions SET status='cancelled' WHERE owner_email=$1", [a.email]);
    expect((await chat(a.cookie, "idem-key-a-abcdefghijkl")).status).toBe(402);
    expect((await chat(b.cookie, "idem-key-b-abcdefghijkl")).status).toBe(200);
  });
});
