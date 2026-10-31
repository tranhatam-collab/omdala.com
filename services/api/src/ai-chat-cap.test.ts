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
const MODEL = "iai-one/iris-7";
const ledger = {
  ledger_release_sha: "1".repeat(40),
  ledger_version_id: "ledger-version-1",
  ledger_deployment_id: "ledger-version-1",
  ledger_bundle_sha256: "2".repeat(64),
  ledger_contract_version: "1.0.0",
  ledger_schema_version: "1",
  ledger_migration_sha256: "3".repeat(64),
};

async function cookieFor(email: string) {
  const part = Buffer.from(
    JSON.stringify({ jti: crypto.randomUUID(), sid: crypto.randomUUID(), email, type: "access", exp: Date.now() + 60 * 60 * 1000 }),
  ).toString("base64url");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(part));
  return `omdala_access_token=${part}.${Buffer.from(new Uint8Array(sig)).toString("base64url")}`;
}

const providerResponse = (payload: unknown, requestId?: string) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Provider-Contract-Version": "1.0.0",
      ...(requestId ? { "X-Request-ID": requestId, "X-Trace-ID": requestId } : {}),
    },
  });

let providerChatCalls = 0;

// A fully reconciled provider: every call costs 0.001 USD and the provider never refuses.
function installProvider() {
  let invocation: Record<string, unknown> | null = null;
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const headers = new Headers(init?.headers);
    if (url.pathname === "/v1/ai/models") {
      return providerResponse({
        ok: true,
        contract_version: "1.0.0",
        data: {
          authority: "aiagent.iai.one",
          transport_origin: "https://api.aiagent.iai.one",
          namespace: "iai-one",
          count: 1,
          models: [{ id: MODEL, capabilities: ["chat"], status: "available" }],
        },
      });
    }
    if (url.pathname === "/v1/ai/chat") {
      providerChatCalls += 1;
      const body = JSON.parse(String(init?.body)) as { request_id: string; model: string };
      invocation = {
        response: "ok",
        model: body.model,
        provider: "iai-one",
        request_id: body.request_id,
        tenant_id: "omdala-com",
        workspace_id: "omdala-com-production",
        run_id: "run-1",
        receipt_id: "receipt-1",
        ledger_entry_id: "ledger-entry-1",
        usage: { input_tokens: 3, output_tokens: 2, total_tokens: 5 },
        cost_usd: 0.001,
        billing_eligible: true,
        cost_ledger_status: "reconciled",
        fallback_used: false,
        fallback_chain: [],
        budget: { limit_usd: 0.25, reserved_usd: 0.01, used_usd: 0.01, remaining_usd: 0.24, reservation_basis: "configured_rate_conservative_ceiling" },
        request_quota: { scope: "api-key-lifetime", limit: 1_000_000, used: providerChatCalls, remaining: 1_000_000 - providerChatCalls },
        ...ledger,
      };
      return providerResponse({ ok: true, contract_version: "1.0.0", data: invocation }, body.request_id);
    }
    if (url.pathname === "/v1/runs/run-1") {
      return providerResponse(
        { ok: true, run: { run_id: "run-1", receipt_id: "receipt-1", request_id: invocation!.request_id, model: MODEL, tenant_id: "omdala-com", workspace_id: "omdala-com-production", status: "success", input_tokens: 3, output_tokens: 2, cost_usd: 0.001, billing_eligible: true } },
        headers.get("x-request-id")!,
      );
    }
    return providerResponse(
      { ok: true, contract_version: "1.0.0", data: { verified: true, execution_status: "success", receipt: { receipt_id: "receipt-1", run_id: "run-1", request_id: invocation!.request_id, model: MODEL, provider: "groq", tenant_id: "omdala-com", workspace_id: "omdala-com-production", input_tokens: 3, output_tokens: 2, cost_usd: 0.001, ledger_entry_id: "ledger-entry-1", billing_eligible: true, cost_ledger_status: "reconciled", ...ledger } } },
      headers.get("x-request-id")!,
    );
  });
}

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
  providerChatCalls = 0;
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
    expect(providerChatCalls).toBe(0);
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
    expect(providerChatCalls).toBe(0);
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
    expect(providerChatCalls).toBe(0);
  });

  it("answers 503 DATABASE_UNAVAILABLE when the ledger cannot be reached, without calling the provider", async () => {
    installProvider();
    ledger_.reserveAiUsage.mockRejectedValue(Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }));
    const response = await chat("down@example.test");
    expect(response.status).toBe(503);
    expect(await code(response)).toBe("DATABASE_UNAVAILABLE");
    expect(providerChatCalls).toBe(0);
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
    expect(providerChatCalls).toBe(0);
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

  it("does not charge a replay of the same Idempotency-Key a second time", async () => {
    installProvider();
    ledger_.reserveAiUsage.mockResolvedValueOnce({ outcome: "reserved" }).mockResolvedValueOnce({ outcome: "duplicate", status: "settled" });
    const first = await chatWith("replay@example.test", env, "idem-key-same-abcdefgh");
    const second = await chatWith("replay@example.test", env, "idem-key-same-abcdefgh");
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const [a, b] = ledger_.reserveAiUsage.mock.calls.map((call) => call[1].requestId);
    expect(a).toBe(b);
    expect(ledger_.settleAiUsage).toHaveBeenCalledTimes(1); // only the first call settles
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
