import { afterEach, describe, expect, it, vi } from "vitest";
import { AiagentProviderError, executeAiagentChat, listAiagentModels } from "./aiagent-client";
import type { ApiBindings } from "./contracts";

// Every provider response below is synthesized in-process; fetch is replaced
// for the whole file and any unexpected call fails the test, so no request can
// reach a real provider.

const KEY = `sk-aiagent-${"a".repeat(48)}`;
const MODEL = "iai-one/iris-7";
const env = {
  ENVIRONMENT: "production",
  AIAGENT_API_URL: "https://api.aiagent.iai.one",
  AIAGENT_WORKSPACE_ID: "omdala-com-production",
  AIAGENT_API_KEY: KEY,
} as unknown as ApiBindings;

const ledger = {
  ledger_release_sha: "1".repeat(40),
  ledger_version_id: "ledger-version-1",
  ledger_deployment_id: "ledger-version-1",
  ledger_bundle_sha256: "2".repeat(64),
  ledger_contract_version: "1.0.0",
  ledger_schema_version: "1",
  ledger_migration_sha256: "3".repeat(64),
};

const input = {
  model: MODEL,
  messages: [{ role: "user" as const, content: "hello" }],
  maxTokens: 64,
};

type Json = Record<string, unknown>;
type Step = "models" | "chat" | "run" | "verify";
type Override = {
  status?: number;
  headers?: Record<string, string | null>;
  contentType?: string;
  rawBody?: string;
  body?: (base: Json) => Json;
  throws?: unknown;
};

function jsonResponse(
  payload: Json | string,
  { status = 200, headers = {}, contentType = "application/json" }: Override = {},
  requestId?: string,
) {
  const merged: Record<string, string | null> = {
    "Content-Type": contentType,
    "X-Provider-Contract-Version": "1.0.0",
    ...(requestId ? { "X-Request-ID": requestId, "X-Trace-ID": requestId } : {}),
    ...headers,
  };
  const final: Record<string, string> = {};
  for (const [key, value] of Object.entries(merged)) if (value !== null) final[key] = value;
  return new Response(typeof payload === "string" ? payload : JSON.stringify(payload), {
    status,
    headers: final,
  });
}

function installProvider(overrides: Partial<Record<Step, Override>> = {}) {
  let chat: Json | null = null;
  const calls: Array<{ url: URL; init: RequestInit | undefined }> = [];
  const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (request, init) => {
    const url = new URL(
      typeof request === "string" ? request : request instanceof URL ? request.href : request.url,
    );
    calls.push({ url, init });
    if (url.origin !== "https://api.aiagent.iai.one") {
      throw new Error(`blocked non-provider origin ${url.origin}`);
    }
    const headers = new Headers(init?.headers);
    const requestId = headers.get("x-request-id") ?? undefined;
    const step: Step =
      url.pathname === "/v1/ai/models"
        ? "models"
        : url.pathname === "/v1/ai/chat"
          ? "chat"
          : url.pathname.startsWith("/v1/runs/")
            ? "run"
            : "verify";
    const override = overrides[step] ?? {};
    if (override.throws) throw override.throws;
    if (override.rawBody !== undefined) {
      return jsonResponse(override.rawBody, override, requestId);
    }

    let base: Json;
    if (step === "models") {
      base = {
        ok: true,
        contract_version: "1.0.0",
        data: {
          authority: "aiagent.iai.one",
          transport_origin: "https://api.aiagent.iai.one",
          namespace: "iai-one",
          count: 1,
          models: [{ id: MODEL, capabilities: ["chat"], status: "available" }],
        },
      };
    } else if (step === "chat") {
      const body = JSON.parse(String(init?.body)) as { request_id: string };
      chat = {
        response: "verified response",
        model: MODEL,
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
        budget: {
          limit_usd: 0.25,
          reserved_usd: 0.01,
          used_usd: 0.01,
          remaining_usd: 0.24,
          reservation_basis: "configured_rate_conservative_ceiling",
        },
        request_quota: { scope: "api-key-lifetime", limit: 10, used: 1, remaining: 9 },
        ...ledger,
      };
      base = { ok: true, contract_version: "1.0.0", data: chat };
    } else if (step === "run") {
      base = {
        ok: true,
        run: {
          run_id: chat!.run_id,
          receipt_id: chat!.receipt_id,
          request_id: chat!.request_id,
          model: chat!.model,
          tenant_id: chat!.tenant_id,
          workspace_id: chat!.workspace_id,
          status: "success",
          input_tokens: 3,
          output_tokens: 2,
          cost_usd: 0.001,
          billing_eligible: true,
        },
      };
    } else {
      base = {
        ok: true,
        contract_version: "1.0.0",
        data: {
          verified: true,
          execution_status: "success",
          receipt: {
            receipt_id: chat!.receipt_id,
            run_id: chat!.run_id,
            request_id: chat!.request_id,
            model: chat!.model,
            provider: "groq",
            tenant_id: chat!.tenant_id,
            workspace_id: chat!.workspace_id,
            input_tokens: 3,
            output_tokens: 2,
            cost_usd: 0.001,
            ledger_entry_id: chat!.ledger_entry_id,
            billing_eligible: true,
            cost_ledger_status: "reconciled",
            ...ledger,
          },
        },
      };
    }
    return jsonResponse(override.body ? override.body(base) : base, override, requestId);
  });
  return { spy, calls };
}

const chatData = (mutate: (data: Json) => void) => (base: Json) => {
  const clone = structuredClone(base);
  mutate(clone.data as Json);
  return clone;
};

async function failure(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    return error as Error;
  }
  throw new Error("expected the call to fail");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AIAGENT client: credential and destination", () => {
  it("makes the happy path call with the bearer credential only to the pinned origin", async () => {
    const { calls } = installProvider();
    const result = await executeAiagentChat(env, "a@omdala.com", "idem-1", input);
    expect(result.cost_usd).toBe(0.001);
    expect(calls.map((c) => c.url.pathname)).toEqual([
      "/v1/ai/models",
      "/v1/ai/chat",
      "/v1/runs/run-1",
      "/v1/ai/verify",
    ]);
    for (const call of calls) {
      expect(new Headers(call.init?.headers).get("authorization")).toBe(`Bearer ${KEY}`);
      expect(call.init?.redirect).toBe("error");
    }
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["wrong prefix", `sk-other-${"a".repeat(48)}`],
    ["too short", "sk-aiagent-abc"],
    ["uppercase hex", `sk-aiagent-${"A".repeat(48)}`],
    ["trailing junk", `${KEY}x`],
  ])("rejects a %s key before any network call", async (_label, key) => {
    const { spy } = installProvider();
    const error = await failure(
      executeAiagentChat({ ...env, AIAGENT_API_KEY: key } as ApiBindings, "a@omdala.com", "k", input),
    );
    expect(error.message).toBe("AIAGENT_RUNTIME_NOT_CONFIGURED");
    expect(spy).not.toHaveBeenCalled();
  });

  it("maps a provider 401 for a rejected key to a code that does not echo the key", async () => {
    installProvider({ models: { status: 401, rawBody: '{"ok":false,"error":"bad key"}' } });
    const error = await failure(executeAiagentChat(env, "a@omdala.com", "k", input));
    expect(error.message).toBe("AIAGENT_HTTP_401");
    expect(error.message).not.toContain(KEY);
  });

  it.each([
    ["foreign host", "https://evil.example"],
    ["http scheme", "http://api.aiagent.iai.one"],
    ["with port", "https://api.aiagent.iai.one:8443"],
    ["with path", "https://api.aiagent.iai.one/v1"],
    ["with credentials", "https://user:pw@api.aiagent.iai.one"],
    ["staging host in production", "https://staging-api.aiagent.iai.one"],
    ["lookalike suffix", "https://api.aiagent.iai.one.evil.example"],
    ["not a url", "api.aiagent.iai.one"],
  ])("refuses a %s destination before any network call", async (_label, url) => {
    const { spy } = installProvider();
    const error = await failure(
      executeAiagentChat({ ...env, AIAGENT_API_URL: url } as ApiBindings, "a@omdala.com", "k", input),
    );
    expect(error.message).toBe("AIAGENT_RUNTIME_NOT_CONFIGURED");
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses a workspace that does not belong to the environment", async () => {
    const { spy } = installProvider();
    const error = await failure(
      executeAiagentChat(
        { ...env, AIAGENT_WORKSPACE_ID: "omdala-com-staging" } as ApiBindings,
        "a@omdala.com",
        "k",
        input,
      ),
    );
    expect(error.message).toBe("AIAGENT_RUNTIME_NOT_CONFIGURED");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("AIAGENT client: wrong host and malformed bodies", () => {
  it("rejects an HTML page served with 200 (captive portal or wrong host)", async () => {
    installProvider({
      models: { contentType: "text/html; charset=utf-8", rawBody: "<html><body>Welcome</body></html>" },
    });
    const error = await failure(listAiagentModels(env));
    expect(error.message).toBe("AIAGENT_JSON_REQUIRED");
  });

  it("rejects HTML mislabeled as JSON", async () => {
    installProvider({ models: { rawBody: "<html>nope</html>" } });
    expect((await failure(listAiagentModels(env))).message).toBe("AIAGENT_JSON_INVALID");
  });

  it.each([
    ["array", "[]"],
    ["string", '"x"'],
    ["null", "null"],
  ])("rejects a JSON %s document", async (_label, rawBody) => {
    installProvider({ models: { rawBody } });
    expect((await failure(listAiagentModels(env))).message).toBe("AIAGENT_JSON_INVALID");
  });

  it("rejects an HTML error page with a 5xx status without parsing it", async () => {
    installProvider({
      models: { status: 502, contentType: "text/html", rawBody: "<h1>Bad gateway</h1>" },
    });
    expect((await failure(listAiagentModels(env))).message).toBe("AIAGENT_HTTP_502");
  });

  it("rejects a response whose declared length exceeds the cap", async () => {
    installProvider({
      models: { rawBody: "{}", headers: { "Content-Length": String(3 * 1024 * 1024) } },
    });
    expect((await failure(listAiagentModels(env))).message).toBe("AIAGENT_RESPONSE_TOO_LARGE");
  });

  it("rejects invalid UTF-8", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]), {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Provider-Contract-Version": "1.0.0" },
      }),
    );
    expect((await failure(listAiagentModels(env))).message).toBe("AIAGENT_JSON_INVALID");
  });

  it("surfaces a redirect refusal instead of following it", async () => {
    installProvider({ models: { throws: new TypeError("unexpected redirect") } });
    const error = await failure(listAiagentModels(env));
    expect(error).toBeInstanceOf(TypeError);
  });

  it("rejects ok:false business failures delivered with HTTP 200", async () => {
    installProvider({ models: { body: () => ({ ok: false, error: { code: "denied" } }) } });
    expect((await failure(listAiagentModels(env))).message).toBe("AIAGENT_BUSINESS_SUCCESS_REQUIRED");
  });
});

describe("AIAGENT client: timeout", () => {
  it("bounds every call with a 60s abort signal", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const { calls } = installProvider();
    await executeAiagentChat(env, "a@omdala.com", "k", input);
    expect(timeout).toHaveBeenCalledWith(60_000);
    for (const call of calls) expect(call.init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("propagates a provider timeout without partial success", async () => {
    const timeoutError = new DOMException("The operation timed out.", "TimeoutError");
    const { calls } = installProvider({ chat: { throws: timeoutError } });
    const error = await failure(executeAiagentChat(env, "a@omdala.com", "k", input));
    expect(error.message).toBe("AIAGENT_TIMEOUT");
    expect(calls.map((c) => c.url.pathname)).toEqual(["/v1/ai/models", "/v1/ai/chat"]);
  });

  it("aborts a hung request when the signal fires", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_request, init) =>
        new Promise((_resolve, reject) => {
          const signal = init!.signal!;
          if (signal.aborted) return reject(signal.reason);
          signal.addEventListener("abort", () => reject(signal.reason));
        }),
    );
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(AbortSignal.abort(new DOMException("t", "TimeoutError")));
    const error = await failure(listAiagentModels(env));
    expect(error.message).toBe("AIAGENT_TIMEOUT");
  });

  it("maps an AbortError to the same timeout code", async () => {
    installProvider({ models: { throws: new DOMException("aborted", "AbortError") } });
    expect((await failure(listAiagentModels(env))).message).toBe("AIAGENT_TIMEOUT");
  });

  it("does not relabel other network failures as timeouts", async () => {
    installProvider({ models: { throws: new TypeError("fetch failed") } });
    const error = await failure(listAiagentModels(env));
    expect(error).toBeInstanceOf(TypeError);
  });
});

describe("AIAGENT client: quota and budget", () => {
  it("maps provider quota exhaustion (429) to a typed code", async () => {
    installProvider({
      chat: { status: 429, rawBody: '{"ok":false,"error":{"code":"quota_exceeded"}}' },
    });
    const error = await failure(executeAiagentChat(env, "a@omdala.com", "k", input));
    expect(error.message).toBe("AIAGENT_HTTP_429");
    expect(error).toBeInstanceOf(AiagentProviderError);
    expect((error as AiagentProviderError).status).toBe(429);
    expect((error as AiagentProviderError).retryAfterSeconds).toBeNull();
  });

  it.each([
    ["seconds", "30", 30],
    ["zero", "0", 0],
    ["huge value is clamped", "999999999", 86_400],
    ["garbage is dropped", "soon", null],
    ["negative is dropped", "-5", null],
    ["empty is dropped", "", null],
  ])("passes Retry-After through bounded: %s", async (_label, header, expected) => {
    installProvider({ chat: { status: 429, rawBody: "{}", headers: { "Retry-After": header } } });
    const error = (await failure(
      executeAiagentChat(env, "a@omdala.com", "k", input),
    )) as AiagentProviderError;
    expect(error.retryAfterSeconds).toBe(expected);
  });

  it("converts an HTTP-date Retry-After to bounded seconds", async () => {
    const date = new Date(Date.now() + 120_000).toUTCString();
    installProvider({ chat: { status: 429, rawBody: "{}", headers: { "Retry-After": date } } });
    const error = (await failure(
      executeAiagentChat(env, "a@omdala.com", "k", input),
    )) as AiagentProviderError;
    expect(error.retryAfterSeconds).toBeGreaterThan(100);
    expect(error.retryAfterSeconds).toBeLessThanOrEqual(121);
  });

  it("treats a 402/403 plan limit as a provider failure", async () => {
    for (const status of [402, 403]) {
      installProvider({ chat: { status, rawBody: "{}" } });
      expect((await failure(executeAiagentChat(env, "a@omdala.com", "k", input))).message).toBe(
        `AIAGENT_HTTP_${status}`,
      );
      vi.restoreAllMocks();
    }
  });

  it.each([
    ["used+remaining != limit", (d: Json) => ((d.request_quota as Json).remaining = 8)],
    ["negative quota used", (d: Json) => ((d.request_quota as Json).used = -1)],
    ["non-integer limit", (d: Json) => ((d.request_quota as Json).limit = 10.5)],
    ["wrong quota scope", (d: Json) => ((d.request_quota as Json).scope = "per-minute")],
    ["missing quota", (d: Json) => delete d.request_quota],
  ])("rejects quota evidence: %s", async (_label, mutate) => {
    installProvider({ chat: { body: chatData(mutate) } });
    expect((await failure(executeAiagentChat(env, "a@omdala.com", "k", input))).message).toBe(
      "AIAGENT_QUOTA_RECONCILIATION_INVALID",
    );
  });

  it.each([
    ["cost above the 0.25 ceiling", (d: Json) => (d.cost_usd = 0.2500001), "AIAGENT_CHAT_RECONCILIATION_INVALID"],
    ["negative cost", (d: Json) => (d.cost_usd = -0.001), "AIAGENT_CHAT_RECONCILIATION_INVALID"],
    ["NaN-like cost", (d: Json) => (d.cost_usd = "0.001"), "AIAGENT_CHAT_RECONCILIATION_INVALID"],
    ["budget over limit", (d: Json) => ((d.budget as Json).limit_usd = 0.5), "AIAGENT_BUDGET_RECONCILIATION_INVALID"],
    ["budget arithmetic mismatch", (d: Json) => ((d.budget as Json).remaining_usd = 0.5), "AIAGENT_BUDGET_RECONCILIATION_INVALID"],
    ["cost above remaining budget", (d: Json) => ((d.budget as Json).used_usd = 0.0005), "AIAGENT_BUDGET_RECONCILIATION_INVALID"],
    ["fallback used", (d: Json) => (d.fallback_used = true), "AIAGENT_CHAT_RECONCILIATION_INVALID"],
    ["usage total mismatch", (d: Json) => ((d.usage as Json).total_tokens = 9), "AIAGENT_USAGE_INVALID"],
  ])("rejects billing evidence: %s", async (_label, mutate, code) => {
    installProvider({ chat: { body: chatData(mutate) } });
    expect((await failure(executeAiagentChat(env, "a@omdala.com", "k", input))).message).toBe(code);
  });
});

describe("AIAGENT client: integrity and correlation (signature-equivalent checks)", () => {
  it("rejects a mismatched X-Request-ID echo", async () => {
    installProvider({ chat: { headers: { "X-Request-ID": "omdala-web-forged" } } });
    expect((await failure(executeAiagentChat(env, "a@omdala.com", "k", input))).message).toBe(
      "AIAGENT_TRANSPORT_CORRELATION_MISMATCH",
    );
  });

  it("rejects a missing X-Trace-ID echo", async () => {
    installProvider({ chat: { headers: { "X-Trace-ID": null } } });
    expect((await failure(executeAiagentChat(env, "a@omdala.com", "k", input))).message).toBe(
      "AIAGENT_TRANSPORT_CORRELATION_MISMATCH",
    );
  });

  it.each([
    ["missing", null],
    ["old", "0.9.0"],
    ["future", "2.0.0"],
  ])("rejects a %s transport contract version", async (_label, version) => {
    installProvider({ models: { headers: { "X-Provider-Contract-Version": version } } });
    expect((await failure(listAiagentModels(env))).message).toBe("AIAGENT_TRANSPORT_CONTRACT_MISMATCH");
  });

  it("rejects a body contract_version that disagrees with the transport header", async () => {
    installProvider({ models: { body: (base) => ({ ...base, contract_version: "2.0.0" }) } });
    expect((await failure(listAiagentModels(env))).message).toBe("AIAGENT_CONTRACT_VERSION_MISMATCH");
  });

  it.each([
    ["foreign tenant", (d: Json) => (d.tenant_id = "other-tenant")],
    ["foreign workspace", (d: Json) => (d.workspace_id = "omdala-com-staging")],
    ["different model", (d: Json) => (d.model = "iai-one/other-9")],
    ["different request id", (d: Json) => (d.request_id = "omdala-web-other")],
    ["not billing eligible", (d: Json) => (d.billing_eligible = false)],
    ["unreconciled ledger", (d: Json) => (d.cost_ledger_status = "pending")],
  ])("rejects chat evidence for a %s", async (_label, mutate) => {
    installProvider({ chat: { body: chatData(mutate) } });
    const error = await failure(executeAiagentChat(env, "a@omdala.com", "k", input));
    expect(error.message).toMatch(/^AIAGENT_(CHAT_RECONCILIATION_INVALID|TRANSPORT_CORRELATION_MISMATCH)$/);
  });

  it("rejects a ledger deployment that does not match the ledger version", async () => {
    installProvider({ chat: { body: chatData((d) => (d.ledger_deployment_id = "other")) } });
    expect((await failure(executeAiagentChat(env, "a@omdala.com", "k", input))).message).toBe(
      "AIAGENT_LEDGER_VERSION_MISMATCH",
    );
  });

  it("rejects a persisted run that disagrees with the invocation", async () => {
    installProvider({
      run: {
        body: (base) => ({
          ...base,
          run: { ...(base.run as Json), cost_usd: 0.002 },
        }),
      },
    });
    expect((await failure(executeAiagentChat(env, "a@omdala.com", "k", input))).message).toBe(
      "AIAGENT_RUN_READBACK_MISMATCH",
    );
  });

  it.each([
    ["receipt cost", (r: Json) => (r.cost_usd = 0.002)],
    ["receipt ledger entry", (r: Json) => (r.ledger_entry_id = "ledger-entry-2")],
    ["receipt ledger bundle hash", (r: Json) => (r.ledger_bundle_sha256 = "9".repeat(64))],
    ["receipt provider echoing the gateway", (r: Json) => (r.provider = "iai-one")],
    ["receipt workspace", (r: Json) => (r.workspace_id = "omdala-com-staging")],
  ])("rejects a verified receipt with a forged %s", async (_label, mutate) => {
    installProvider({
      verify: {
        body: (base) => {
          const clone = structuredClone(base);
          mutate(((clone.data as Json).receipt as Json));
          return clone;
        },
      },
    });
    expect((await failure(executeAiagentChat(env, "a@omdala.com", "k", input))).message).toBe(
      "AIAGENT_VERIFY_RECONCILIATION_MISMATCH",
    );
  });

  it("rejects an unverified receipt", async () => {
    installProvider({
      verify: {
        body: (base) => {
          const clone = structuredClone(base);
          (clone.data as Json).verified = false;
          return clone;
        },
      },
    });
    expect((await failure(executeAiagentChat(env, "a@omdala.com", "k", input))).message).toBe(
      "AIAGENT_VERIFY_RECONCILIATION_MISMATCH",
    );
  });

  it("does not leak the credential in any thrown error", async () => {
    for (const override of [
      { models: { status: 401, rawBody: "{}" } },
      { chat: { status: 429, rawBody: "{}" } },
      { verify: { body: () => ({ ok: true, contract_version: "1.0.0", data: {} }) } },
    ] as Array<Partial<Record<Step, Override>>>) {
      installProvider(override);
      const error = await failure(executeAiagentChat(env, "a@omdala.com", "k", input));
      expect(`${error.name}${error.message}${error.stack ?? ""}`).not.toContain(KEY);
      vi.restoreAllMocks();
    }
  });
});
