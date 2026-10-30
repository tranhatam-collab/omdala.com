// WO-T2-19 (matrix gap 8): CHARACTERIZATION of the chat path, not a feature.
//
// There is no per-tenant cost or usage cap on POST /v1/ai/chat today. These tests
// pin down what exists (a per-request bound and an in-memory per-minute limiter)
// and what does not (any cumulative accounting or plan check), so that the day a
// cap is built these assertions flip on purpose. The proposed design is in
// docs/06-strategy/reports/T2/WO-T2-19.md.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repo = vi.hoisted(() => ({
  readOrCreateBillingSubscription: vi.fn(),
  readBillingUsageMinutesToday: vi.fn(),
  createAnalyticsEvent: vi.fn(),
  listOrCreateAnalyticsEvents: vi.fn(),
}));
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
let providerCostUsd = 0;

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
      providerCostUsd += 0.001;
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
  providerCostUsd = 0;
  Object.values(repo).forEach((fn) => fn.mockReset());
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-30T12:00:00.000Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("what limits a tenant's AI use today", () => {
  it("bounds a single request: tokens, messages and size (422 invalid_ai_request)", async () => {
    installProvider();
    for (const extra of [{ maxTokens: 2049 }, { maxTokens: 0 }, { messages: [] }]) {
      const response = await chat("bounded@example.test", extra);
      expect([400, 422]).toContain(response.status);
    }
    expect(providerChatCalls).toBe(0);
  });

  it("limits requests per minute per account, in memory, with the generic code rate_limited", async () => {
    installProvider();
    const email = "burst@example.test";
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) statuses.push((await chat(email)).status);
    expect(statuses.slice(0, 20).every((s) => s === 200)).toBe(true);
    expect(statuses[20]).toBe(429);
    const limited = await chat(email);
    expect(((await limited.json()) as { error: { code: string } }).error.code).toBe("rate_limited");
    // a different account is not affected
    expect((await chat("other@example.test")).status).toBe(200);
  });
});

describe("what does not exist: any cumulative per-tenant cap (GAP)", () => {
  it("lets one account keep spending across windows with no ceiling", async () => {
    installProvider();
    const email = "heavy@example.test";
    let ok = 0;
    for (let minute = 0; minute < 5; minute++) {
      for (let i = 0; i < 20; i++) if ((await chat(email)).status === 200) ok += 1;
      vi.setSystemTime(Date.now() + 61_000); // the per-minute window rolls over
    }
    expect(ok).toBe(100);
    expect(providerChatCalls).toBe(100);
    expect(providerCostUsd).toBeCloseTo(0.1, 6); // no cap stopped it, and nothing recorded it per tenant
  });

  it("never reads or writes usage, billing or analytics state on the chat path", async () => {
    installProvider();
    for (let i = 0; i < 3; i++) expect((await chat("ledgerless@example.test")).status).toBe(200);
    for (const fn of Object.values(repo)) expect(fn).not.toHaveBeenCalled();
  });

  it("does not consult the subscription: a cancelled or past-due plan is not checked", async () => {
    installProvider();
    repo.readOrCreateBillingSubscription.mockResolvedValue({ id: "sub_x", appId: "om-ai", planId: "free", status: "cancelled", billingCycle: "monthly" });
    expect((await chat("cancelled@example.test")).status).toBe(200);
    expect(repo.readOrCreateBillingSubscription).not.toHaveBeenCalled();
  });

  it("shares one provider key and quota across every tenant (noisy neighbour)", async () => {
    const fetchSpy = installProvider();
    await chat("a@example.test");
    await chat("b@example.test");
    const keys = new Set(
      fetchSpy.mock.calls.map(([, init]) => new Headers((init as RequestInit).headers).get("authorization")),
    );
    expect(keys.size).toBe(1); // one credential, so one tenant exhausting it is everyone's 429
  });
});
