import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./db/auth-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/auth-repository")>()),
  isAuthSessionActive: vi.fn(async () => true),
}));

import app from "./index";

const env = {
  ENVIRONMENT: "production",
  MAGIC_LINK_SECRET: "test_magic_secret_for_aiagent_proxy_routes",
  AIAGENT_API_URL: "https://api.aiagent.iai.one",
  AIAGENT_WORKSPACE_ID: "omdala-com-production",
  AIAGENT_API_KEY: `sk-aiagent-${"a".repeat(48)}`,
};

const model = "iai-one/iris-7";
const ledger = {
  ledger_release_sha: "1".repeat(40),
  ledger_version_id: "ledger-version-1",
  ledger_deployment_id: "ledger-version-1",
  ledger_bundle_sha256: "2".repeat(64),
  ledger_contract_version: "1.0.0",
  ledger_schema_version: "1",
  ledger_migration_sha256: "3".repeat(64),
};

async function accessCookie(email = "operator@omdala.com") {
  const payload = {
    jti: "11111111-1111-4111-8111-111111111111",
    sid: "22222222-2222-4222-8222-222222222222",
    email,
    type: "access" as const,
    exp: Date.now() + 60 * 60 * 1000,
  };
  const payloadPart = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.MAGIC_LINK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadPart),
  );
  return `omdala_access_token=${payloadPart}.${Buffer.from(
    new Uint8Array(signature),
  ).toString("base64url")}`;
}

function providerResponse(payload: unknown, requestId?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Provider-Contract-Version": "1.0.0",
  };
  if (requestId) {
    headers["X-Request-ID"] = requestId;
    headers["X-Trace-ID"] = requestId;
  }
  return new Response(JSON.stringify(payload), { status: 200, headers });
}

function catalogResponse() {
  return providerResponse({
    ok: true,
    contract_version: "1.0.0",
    data: {
      authority: "aiagent.iai.one",
      transport_origin: "https://api.aiagent.iai.one",
      namespace: "iai-one",
      count: 1,
      models: [{ id: model, capabilities: ["chat"], status: "available" }],
    },
  });
}

function installProviderMock(
  mutation?: "run" | "receipt" | "cost-cap" | "budget-cost",
) {
  let invocation: Record<string, unknown> | null = null;
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    const headers = new Headers(init?.headers);
    expect(url.origin).toBe("https://api.aiagent.iai.one");
    expect(headers.get("authorization")).toBe(`Bearer ${env.AIAGENT_API_KEY}`);
    expect(headers.get("x-tenant-id")).toBe("omdala-com");
    expect(headers.get("x-workspace-id")).toBe("omdala-com-production");
    expect(headers.get("x-actor-role")).toBe("agent");
    expect(headers.get("x-surface")).toBe("agent");

    if (url.pathname === "/v1/ai/models") return catalogResponse();

    if (url.pathname === "/v1/ai/chat") {
      const body = JSON.parse(String(init?.body)) as {
        request_id: string;
        model: string;
      };
      expect(headers.get("idempotency-key")).toBe(body.request_id);
      expect(headers.get("x-request-id")).toBe(body.request_id);
      expect(headers.get("x-trace-id")).toBe(body.request_id);
      const invocationCost =
        mutation === "cost-cap"
          ? 0.2500001
          : mutation === "budget-cost"
            ? 0.02
            : 0.001;
      invocation = {
        response: "verified response",
        model: body.model,
        provider: "iai-one",
        request_id: body.request_id,
        tenant_id: "omdala-com",
        workspace_id: "omdala-com-production",
        run_id: "run-1",
        receipt_id: "receipt-1",
        ledger_entry_id: "ledger-entry-1",
        usage: { input_tokens: 3, output_tokens: 2, total_tokens: 5 },
        cost_usd: invocationCost,
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
        request_quota: {
          scope: "api-key-lifetime",
          limit: 10,
          used: 1,
          remaining: 9,
        },
        ...ledger,
      };
      return providerResponse(
        { ok: true, contract_version: "1.0.0", data: invocation },
        body.request_id,
      );
    }

    if (url.pathname === "/v1/runs/run-1") {
      if (!invocation) throw new Error("chat must precede run readback");
      const requestId = headers.get("x-request-id")!;
      return providerResponse(
        {
          ok: true,
          run: {
            run_id: mutation === "run" ? "wrong-run" : invocation.run_id,
            receipt_id: invocation.receipt_id,
            request_id: invocation.request_id,
            model: invocation.model,
            tenant_id: invocation.tenant_id,
            workspace_id: invocation.workspace_id,
            status: "success",
            input_tokens: 3,
            output_tokens: 2,
            cost_usd: 0.001,
            billing_eligible: true,
          },
        },
        requestId,
      );
    }

    if (url.pathname === "/v1/ai/verify") {
      if (!invocation) throw new Error("chat must precede receipt verification");
      const requestId = headers.get("x-request-id")!;
      return providerResponse(
        {
          ok: true,
          contract_version: "1.0.0",
          data: {
            verified: true,
            execution_status: "success",
            receipt: {
              receipt_id: invocation.receipt_id,
              run_id: invocation.run_id,
              request_id: invocation.request_id,
              model: invocation.model,
              provider: "groq",
              tenant_id: invocation.tenant_id,
              workspace_id: invocation.workspace_id,
              input_tokens: 3,
              output_tokens: 2,
              cost_usd: mutation === "receipt" ? 0.002 : 0.001,
              ledger_entry_id: invocation.ledger_entry_id,
              billing_eligible: true,
              cost_ledger_status: "reconciled",
              ...ledger,
            },
          },
        },
        requestId,
      );
    }

    throw new Error(`unexpected AIAGENT path: ${url.pathname}`);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("authenticated OMDALA AIAGENT proxy", () => {
  it("does not contact AIAGENT without an authenticated OMDALA session", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const models = await app.request("http://localhost/v1/ai/models", {}, env);
    const chat = await app.request(
      "http://localhost/v1/ai/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": "test-unauthenticated" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "hi" }] }),
      },
      env,
    );
    expect(models.status).toBe(401);
    expect(chat.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns only the credential-verified AIAGENT catalog", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(catalogResponse());
    const response = await app.request(
      "http://localhost/v1/ai/models",
      { headers: { cookie: await accessCookie("catalog@omdala.com") } },
      env,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        authority: {
          provider: "aiagent",
          ready: true,
          tenant: "omdala-com",
          workspace: "omdala-com-production",
          directUpstreamAllowed: false,
        },
        models: [{ id: model, status: "available" }],
        total: 1,
      },
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("fails closed and cancels a streamed provider response above the byte cap", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(1024 * 1024));
      },
      cancel() {
        cancelled = true;
      },
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Provider-Contract-Version": "1.0.0",
        },
      }),
    );
    const response = await app.request(
      "http://localhost/v1/ai/models",
      { headers: { cookie: await accessCookie("oversize@omdala.com") } },
      env,
    );
    expect(response.status).toBe(503);
    expect(cancelled).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("reconciles catalog, chat, persisted run, and verified receipt before returning a sanitized result", async () => {
    const fetchSpy = installProviderMock();
    const response = await app.request(
      "http://localhost/v1/ai/chat",
      {
        method: "POST",
        headers: {
          cookie: await accessCookie("chat@omdala.com"),
          "Content-Type": "application/json",
          "Idempotency-Key": "browser-request-1",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "verify the full chain" }],
          maxTokens: 32,
        }),
      },
      env,
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { data: Record<string, unknown> };
    expect(payload.data).toMatchObject({
      response: "verified response",
      model,
      tenant_id: "omdala-com",
      workspace_id: "omdala-com-production",
      run_id: "run-1",
      receipt_id: "receipt-1",
      ledger_entry_id: "ledger-entry-1",
      cost_usd: 0.001,
      billing_eligible: true,
      cost_ledger_status: "reconciled",
    });
    expect(payload.data).not.toHaveProperty("provider");
    expect(payload.data).not.toHaveProperty("budget");
    expect(payload.data).not.toHaveProperty("fallback_chain");
    expect(payload.data).not.toHaveProperty("ledger_release_sha");
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it.each(["run", "receipt"] as const)(
    "fails closed without retry on %s reconciliation mismatch",
    async (mutation) => {
      const fetchSpy = installProviderMock(mutation);
      const response = await app.request(
        "http://localhost/v1/ai/chat",
        {
          method: "POST",
          headers: {
            cookie: await accessCookie(`${mutation}@omdala.com`),
            "Content-Type": "application/json",
            "Idempotency-Key": `browser-${mutation}-mismatch`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "must fail closed" }],
            maxTokens: 16,
          }),
        },
        env,
      );
      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toMatchObject({
        ok: false,
        error: { code: "aiagent_reconciliation_failed" },
      });
      expect(fetchSpy).toHaveBeenCalledTimes(mutation === "run" ? 3 : 4);
    },
  );

  it.each(["cost-cap", "budget-cost"] as const)(
    "fails closed before run readback when %s reconciliation is invalid",
    async (mutation) => {
      const fetchSpy = installProviderMock(mutation);
      const response = await app.request(
        "http://localhost/v1/ai/chat",
        {
          method: "POST",
          headers: {
            cookie: await accessCookie(`${mutation}@omdala.com`),
            "Content-Type": "application/json",
            "Idempotency-Key": `browser-${mutation}-mismatch`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "enforce acceptance cost ceiling" }],
            maxTokens: 16,
          }),
        },
        env,
      );
      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toMatchObject({
        ok: false,
        error: { code: "aiagent_reconciliation_failed" },
      });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    },
  );
});
