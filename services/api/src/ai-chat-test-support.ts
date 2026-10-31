// Shared doubles for the AIAGENT chat path: a fully reconciled provider that counts how many
// times /v1/ai/chat was reached, and a signed access cookie.
import { vi } from "vitest";

export const providerCalls = { chat: 0 };
export const MODEL = "iai-one/iris-7";
const ledger = {
  ledger_release_sha: "1".repeat(40),
  ledger_version_id: "ledger-version-1",
  ledger_deployment_id: "ledger-version-1",
  ledger_bundle_sha256: "2".repeat(64),
  ledger_contract_version: "1.0.0",
  ledger_schema_version: "1",
  ledger_migration_sha256: "3".repeat(64),
};

export async function cookieFor(secret: string, email: string) {
  const part = Buffer.from(
    JSON.stringify({ jti: crypto.randomUUID(), sid: crypto.randomUUID(), email, type: "access", exp: Date.now() + 60 * 60 * 1000 }),
  ).toString("base64url");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(part));
  return `omdala_access_token=${part}.${Buffer.from(new Uint8Array(sig)).toString("base64url")}`;
}

export const providerResponse = (payload: unknown, requestId?: string) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Provider-Contract-Version": "1.0.0",
      ...(requestId ? { "X-Request-ID": requestId, "X-Trace-ID": requestId } : {}),
    },
  });


// A fully reconciled provider: every call costs 0.001 USD and the provider never refuses.
export function installProvider() {
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
      providerCalls.chat += 1;
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
        request_quota: { scope: "api-key-lifetime", limit: 1_000_000, used: providerCalls.chat, remaining: 1_000_000 - providerCalls.chat },
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

