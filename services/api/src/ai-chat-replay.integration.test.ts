// WO-T2-24: a replayed Idempotency-Key must never get a free provider call.
// PREP_UNDER_ASSUMPTION(AI cost cap, fail closed when unset)
//
// Real PostgreSQL, the real route and the real ledger. T4's sequence (WO-T4-14 finding 1): a
// request is refused before dispatch, so its reservation is released; replaying the same
// key used to skip the reservation and reach the provider uncapped, as often as wanted.
// Skipped unless OMDALA_TEST_DATABASE_URL names a disposable server.
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
const SECRET = "test_ai_replay_secret_value_0123456789";

describe.skipIf(!adminUrl)("AI chat replay of an Idempotency-Key on real PostgreSQL", () => {
  const dbName = `omdala_replay_${randomBytes(6).toString("hex")}`;
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
      OMDALA_AI_DAILY_COST_CAP_USD: "1",
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
    const email = `replay-${(seq += 1)}-${randomBytes(3).toString("hex")}@example.test`;
    const cookie = await cookieFor(SECRET, email);
    const payload = JSON.parse(Buffer.from(cookie.split("=")[1].split(".")[0], "base64url").toString()) as { sid: string };
    await pg.query(
      "INSERT INTO omdala.auth_sessions (id, email, current_refresh_jti, refresh_expires_at) VALUES ($1::uuid, $2, $3::uuid, NOW() + interval '1 day')",
      [payload.sid, email, crypto.randomUUID()],
    );
    return { email, cookie };
  }
  const chat = (cookie: string, key: string) =>
    app.request(
      "http://localhost/v1/ai/chat",
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie, "idempotency-key": key },
        body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: "hi" }], maxTokens: 32 }),
      },
      env,
    );
  const ledger = async (email: string) =>
    (await pg.query("SELECT status FROM omdala.ai_usage_ledger WHERE owner_email=$1 ORDER BY created_at", [email])).rows.map((r) => r.status as string);
  const committed = async (email: string) =>
    Number((await pg.query("SELECT COALESCE(SUM(committed_usd),0) AS t FROM omdala.ai_usage_days WHERE owner_email=$1", [email])).rows[0].t);
  // A provider that refuses /v1/ai/chat while `refuse` is set, and behaves otherwise.
  function provider() {
    const spy = installProvider();
    const real = spy.getMockImplementation()!;
    const state = { refuse: false };
    spy.mockImplementation(async (input, init) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      if (state.refuse && url.pathname === "/v1/ai/chat") {
        providerCalls.chat += 1;
        return new Response("{}", { status: 429, headers: { "content-type": "application/json" } });
      }
      return real(input, init);
    });
    return state;
  }

  it("a released key replayed with a healthy provider is refused, not served for free", async () => {
    const state = provider();
    const { email, cookie } = await account();
    state.refuse = true;
    const first = await chat(cookie, "idem-key-release-abcdefgh");
    expect(first.status).not.toBe(200);
    expect(await ledger(email)).toEqual(["released"]);
    expect(await committed(email)).toBe(0);

    state.refuse = false;
    const callsBefore = providerCalls.chat;
    const replay = await chat(cookie, "idem-key-release-abcdefgh");
    expect(replay.status).toBe(409);
    expect(((await replay.json()) as { error: { code: string } }).error.code).toBe("idempotency_key_reused");
    expect(providerCalls.chat).toBe(callsBefore); // the provider was not reached
    expect(await ledger(email)).toEqual(["released"]);
    expect(await committed(email)).toBe(0);
  });

  it("the replay loop cannot run the provider more often than the cap allows", async () => {
    const state = provider();
    const { email, cookie } = await account();
    let served = 0;
    for (let i = 0; i < 12; i++) {
      state.refuse = true;
      await chat(cookie, "idem-key-loop-abcdefghij");
      state.refuse = false;
      if ((await chat(cookie, "idem-key-loop-abcdefghij")).status === 200) served += 1;
    }
    expect(served).toBe(0);
    expect(await committed(email)).toBeLessThanOrEqual(1);
  });

  it("a settled key replayed gets a conflict and no second provider call", async () => {
    provider();
    const { email, cookie } = await account();
    expect((await chat(cookie, "idem-key-settled-abcdefgh")).status).toBe(200);
    expect(providerCalls.chat).toBe(1);
    expect(await ledger(email)).toEqual(["settled"]);
    const replay = await chat(cookie, "idem-key-settled-abcdefgh");
    expect(replay.status).toBe(409);
    expect(providerCalls.chat).toBe(1);
    expect(await committed(email)).toBeCloseTo(0.001, 6);
  });

  it("a key whose reservation is still held is refused too", async () => {
    provider();
    const { email, cookie } = await account();
    expect((await chat(cookie, "idem-key-held-abcdefghijk")).status).toBe(200);
    await pg.query("UPDATE omdala.ai_usage_ledger SET status='reserved', settled_usd=NULL, reserved_usd=0.25 WHERE owner_email=$1", [email]);
    providerCalls.chat = 0;
    expect((await chat(cookie, "idem-key-held-abcdefghijk")).status).toBe(409);
    expect(providerCalls.chat).toBe(0);
  });

  it("a new key is charged normally and still stops at the cap", async () => {
    provider();
    const { email, cookie } = await account();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await chat(cookie, `idem-key-fresh-${i}-abcdefgh`)).status);
    // each call settles at 0.001, so the 1 USD cap is not reached: all served
    expect(statuses.every((s) => s === 200)).toBe(true);
    expect((await ledger(email)).every((s) => s === "settled")).toBe(true);
    await pg.query("UPDATE omdala.ai_usage_days SET committed_usd = 0.9 WHERE owner_email=$1", [email]);
    const capped = await chat(cookie, "idem-key-over-abcdefghijk");
    expect(capped.status).toBe(429);
  });
});
