// WO-T2-20 (AI-06): per-tenant daily AI cost cap on POST /v1/ai/chat.
// PREP_UNDER_ASSUMPTION(AI cost cap, fail closed when unset)
// The repository is mocked here; the atomicity under concurrency is proved against real
// SQL in db/ai-usage-repository.integration.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repo = vi.hoisted(() => ({
  readOrCreateBillingSubscription: vi.fn(),
  readBillingUsageMinutesToday: vi.fn(),
  createAnalyticsEvent: vi.fn(),
  listOrCreateAnalyticsEvents: vi.fn(),
}));
const ledger_ = vi.hoisted(() => ({
  reserveAiUsage: vi.fn(),
  settleAiUsage: vi.fn(),
  releaseAiUsage: vi.fn(),
}));
vi.mock("./db/ai-usage-repository", () => ledger_);
vi.mock("./db/runtime-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/runtime-repository")>()),
  ...repo,
}));
vi.mock("./db/auth-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/auth-repository")>()),
  isAuthSessionActive: vi.fn(async () => true),
}));

import app from "./index";
import { MODEL, cookieFor as cookieForSecret, installProvider, providerCalls, providerResponse } from "./ai-chat-test-support";

const SECRET = "test_ai_usage_gap_secret_value_0123456789";
const env = {
  ENVIRONMENT: "production",
  DATABASE_URL: "postgres://example.local/db",
  OMDALA_AI_DAILY_COST_CAP_USD: "5",
  MAGIC_LINK_SECRET: SECRET,
  AIAGENT_API_URL: "https://api.aiagent.iai.one",
  AIAGENT_WORKSPACE_ID: "omdala-com-production",
  AIAGENT_API_KEY: `sk-aiagent-${"a".repeat(48)}`,
};
const cookieFor = (email: string) => cookieForSecret(SECRET, email);
let sequence = 0;
async function chat(email: string, extra: Record<string, unknown> = {}) {
  sequence += 1;
  return app.request(
    "http://localhost/v1/ai/chat",
    {
      method: "POST",
      headers: { "content-type": "application/json", cookie: await cookieFor(email), "idempotency-key": `idem-key-${sequence}-abcdefgh` },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: "hi" }], maxTokens: 32, ...extra }),
    },
    env,
  );
}

beforeEach(() => {
  providerCalls.chat = 0;
  Object.values(repo).forEach((fn) => fn.mockReset());
  Object.values(ledger_).forEach((fn) => fn.mockReset());
  repo.readOrCreateBillingSubscription.mockResolvedValue({ id: "sub_x", appId: "om-ai", planId: "free", status: "active", billingCycle: "monthly" });
  ledger_.reserveAiUsage.mockResolvedValue({ outcome: "reserved" });
  ledger_.settleAiUsage.mockResolvedValue(true);
  ledger_.releaseAiUsage.mockResolvedValue(true);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-30T12:00:00.000Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function chatWith(email: string, bindings: Record<string, unknown>, key = `idem-key-${++sequence}-abcdefgh`) {
  return app.request(
    "http://localhost/v1/ai/chat",
    {
      method: "POST",
      headers: { "content-type": "application/json", cookie: await cookieFor(email), "idempotency-key": key },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: "hi" }], maxTokens: 32 }),
    },
    bindings,
  );
}
const code = async (r: Response) => ((await r.json()) as { error: { code: string } }).error.code;

describe("what limits a tenant's AI use", () => {
  it("bounds a single request: tokens, messages and size (422 invalid_ai_request)", async () => {
    installProvider();
    const huge = [{ role: "user", content: "x".repeat(20_001) }];
    const cases: Record<string, unknown>[] = [
      { maxTokens: 2049 }, { maxTokens: 0 }, { maxTokens: 1.5 }, { messages: [] }, { messages: huge },
      { messages: [null] }, { messages: [{ role: "user", content: 7 }] }, { messages: [{ role: "tool", content: "x" }] },
      { messages: [{ role: "user", content: "  " }] }, { model: "not a model id" },
      { messages: Array.from({ length: 21 }, () => ({ role: "user", content: "x" })) },
    ];
    for (const extra of cases) {
      const response = await chat("bounded@example.test", extra);
      expect([400, 422], JSON.stringify(extra).slice(0, 60)).toContain(response.status);
    }
    expect(providerCalls.chat).toBe(0);
    // invalid requests are refused before the ledger is touched
    expect(ledger_.reserveAiUsage).not.toHaveBeenCalled();
    expect(ledger_.releaseAiUsage).not.toHaveBeenCalled();
    expect(ledger_.settleAiUsage).not.toHaveBeenCalled();
  });

  it("limits requests per minute per account with the generic code rate_limited", async () => {
    installProvider();
    const email = "burst@example.test";
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) statuses.push((await chat(email)).status);
    expect(statuses.slice(0, 20).every((s) => s === 200)).toBe(true);
    expect(statuses[20]).toBe(429);
    expect(await code(await chat(email))).toBe("rate_limited");
    expect((await chat("other@example.test")).status).toBe(200);
  });
});

describe("daily cost cap", () => {
  it("reserves before the provider call and settles with the reported cost after it", async () => {
    installProvider();
    const order: string[] = [];
    ledger_.reserveAiUsage.mockImplementation(async () => (order.push("reserve"), { outcome: "reserved" }));
    ledger_.settleAiUsage.mockImplementation(async () => (order.push("settle"), true));
    const fetchSpy = installProvider();
    fetchSpy.mockImplementationOnce(async () => {
      order.push("provider");
      return providerResponse({ ok: true, contract_version: "1.0.0", data: { authority: "aiagent.iai.one", transport_origin: "https://api.aiagent.iai.one", namespace: "iai-one", count: 1, models: [{ id: MODEL, capabilities: ["chat"], status: "available" }] } });
    });
    const response = await chat("spender@example.test");
    expect(response.status).toBe(200);
    expect(order[0]).toBe("reserve");
    expect(order.indexOf("provider")).toBeGreaterThan(0);
    expect(order[order.length - 1]).toBe("settle");
    const reserve = ledger_.reserveAiUsage.mock.calls[0][1];
    expect(reserve).toMatchObject({ ownerEmail: "spender@example.test", capUsd: 5, estimateUsd: 0.25, usageDay: "2026-10-30" });
    expect(ledger_.settleAiUsage.mock.calls[0][1]).toMatchObject({ ownerEmail: "spender@example.test", requestId: reserve.requestId, spentUsd: 0.001 });
    expect(ledger_.releaseAiUsage).not.toHaveBeenCalled();
  });

  it("answers 429 ai_tenant_cap_exceeded with Retry-After to the next UTC midnight and never calls the provider", async () => {
    installProvider();
    ledger_.reserveAiUsage.mockResolvedValue({ outcome: "cap_exceeded", committedUsd: 5 });
    const response = await chat("capped@example.test");
    expect(response.status).toBe(429);
    expect(await code(response.clone())).toBe("ai_tenant_cap_exceeded");
    expect(response.headers.get("retry-after")).toBe(String(12 * 3600)); // clock is 12:00:00 UTC
    expect(providerCalls.chat).toBe(0);
    expect(ledger_.settleAiUsage).not.toHaveBeenCalled();
  });

  it("answers 402 subscription_inactive for cancelled and past_due plans before reserving", async () => {
    installProvider();
    for (const status of ["cancelled", "past_due"]) {
      repo.readOrCreateBillingSubscription.mockResolvedValue({ id: "sub_x", appId: "om-ai", planId: "free", status, billingCycle: "monthly" });
      const response = await chat(`${status}@example.test`);
      expect(response.status).toBe(402);
      expect(await code(response)).toBe("subscription_inactive");
    }
    expect(ledger_.reserveAiUsage).not.toHaveBeenCalled();
    expect(providerCalls.chat).toBe(0);
  });

  it("answers 503 DATABASE_UNAVAILABLE when the ledger cannot be reached, without calling the provider", async () => {
    installProvider();
    ledger_.reserveAiUsage.mockRejectedValue(Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }));
    const response = await chat("down@example.test");
    expect(response.status).toBe(503);
    expect(await code(response)).toBe("DATABASE_UNAVAILABLE");
    expect(providerCalls.chat).toBe(0);
  });

  it("fails closed when the cap is unset or invalid in staging and production", async () => {
    installProvider();
    for (const environment of ["production", "staging"]) {
      for (const cap of [undefined, "", "0", "-1", "abc", "1e3", "NaN", "2000000"]) {
        const response = await chatWith("closed@example.test", { ...env, ENVIRONMENT: environment, OMDALA_AI_DAILY_COST_CAP_USD: cap });
        if (response.status !== 503) throw new Error(`${environment} cap=${String(cap)} -> ${response.status} ${await response.text()}`);
        expect(await code(response)).toBe("ai_cap_not_configured");
      }
    }
    expect(providerCalls.chat).toBe(0);
    expect(ledger_.reserveAiUsage).not.toHaveBeenCalled();
  });

  it("does not require a cap in local, development and test", async () => {
    installProvider();
    for (const environment of ["local", "development", "test"]) {
      const response = await chatWith(`${environment}@example.test`, { ...env, ENVIRONMENT: environment, OMDALA_AI_DAILY_COST_CAP_USD: undefined, DATABASE_URL: undefined });
      expect(await response.text()).not.toContain("ai_cap_not_configured");
    }
    expect(ledger_.reserveAiUsage).not.toHaveBeenCalled();
  });

  it("releases the reservation when the provider refused before executing anything", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response("{}", { status: 429, headers: { "content-type": "application/json" } }));
    const response = await chat("refused@example.test");
    expect(response.status).not.toBe(200);
    expect(ledger_.reserveAiUsage).toHaveBeenCalledTimes(1);
    expect(ledger_.releaseAiUsage).toHaveBeenCalledTimes(1);
    expect(ledger_.settleAiUsage).not.toHaveBeenCalled();
  });

  it("refuses a replayed Idempotency-Key in every ledger state without calling the provider", async () => {
    installProvider();
    for (const status of ["released", "settled", "reserved"]) {
      ledger_.reserveAiUsage.mockResolvedValueOnce({ outcome: "duplicate", status });
      const before = providerCalls.chat;
      const response = await chatWith(`replay-${status}@example.test`, env, "idem-key-same-abcdefgh");
      expect(response.status, status).toBe(409);
      expect(await code(response)).toBe("idempotency_key_reused");
      expect(providerCalls.chat).toBe(before);
    }
    expect(ledger_.settleAiUsage).not.toHaveBeenCalled();
    expect(ledger_.releaseAiUsage).not.toHaveBeenCalled();
  });

  it("derives the request id from the account and the key, so the same pair always collides", async () => {
    installProvider();
    await chatWith("pair@example.test", env, "idem-key-pair-abcdefgh");
    await chatWith("pair@example.test", env, "idem-key-pair-abcdefgh");
    await chatWith("other-pair@example.test", env, "idem-key-pair-abcdefgh");
    const ids = ledger_.reserveAiUsage.mock.calls.map((call) => call[1].requestId);
    expect(ids[0]).toBe(ids[1]);
    expect(ids[2]).not.toBe(ids[0]);
  });

  it("keeps tenants apart: the owner always comes from the session", async () => {
    installProvider();
    await chat("one@example.test");
    await chat("two@example.test");
    expect(ledger_.reserveAiUsage.mock.calls.map((c) => c[1].ownerEmail)).toEqual(["one@example.test", "two@example.test"]);
  });

  it("does not turn a ledger failure after the answer into an error", async () => {
    installProvider();
    ledger_.settleAiUsage.mockRejectedValue(new Error("connection reset"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect((await chat("settlefail@example.test")).status).toBe(200);
  });
});
