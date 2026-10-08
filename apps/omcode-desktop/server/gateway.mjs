import { randomUUID } from "node:crypto";
import { assertEgressAllowed } from "./egress-policy.mjs";
import {
  AIAGENT_NAMESPACE,
  aiagentDeploymentForOrigin,
  isLocalHost,
  validateEndpoint,
} from "./endpoint-policy.mjs";

export const CONTRACT_VERSION = "1.0.0";
const MODEL_PATTERN = /^iai-one\/[a-z0-9][a-z0-9._-]{0,63}$/;
export const policy = (task_type) => ({
  task_type,
  risk_level: "low",
  data_sensitivity: "internal",
});
function expectedIdentity(provider) {
  const endpoint = validateEndpoint(provider.baseUrl);
  const url = new URL(endpoint);
  const deployment = aiagentDeploymentForOrigin(endpoint);
  if (deployment)
    return {
      origin: deployment.origin,
      tenantId: deployment.tenantId,
      workspaceId: deployment.workspaceId,
    };
  if (
    isLocalHost(url.hostname) &&
    /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(provider.tenantId || "") &&
    /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(provider.workspaceId || "")
  )
    return {
      origin: url.origin,
      tenantId: provider.tenantId,
      workspaceId: provider.workspaceId,
    };
  throw new Error("AIAGENT deployment identity không hợp lệ.");
}
export function gatewayHeaders(provider, key, requestId) {
  const identity = expectedIdentity(provider);
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    "X-Actor-Role": "agent",
    "X-Surface": "agent",
    // These are bounded policy selections. AIAGENT strips them at ingress and
    // reconstructs workspace, actor, quota and billing authority from the key.
    "X-Tenant-ID": identity.tenantId,
    ...(requestId
      ? {
          "X-Request-ID": requestId,
          "X-Trace-ID": requestId,
          "Idempotency-Key": requestId,
        }
      : {}),
  };
}
export async function envelope(response) {
  if (!response.ok) {
    const error = new Error(
      `AIAGENT: HTTP ${response.status}. Kiểm tra quyền và hạn mức; không tự thử lại yêu cầu tính phí.`,
    );
    error.status = response.status;
    throw error;
  }
  const value = await response.json();
  if (
    value.ok !== true ||
    value.contract_version !== CONTRACT_VERSION ||
    !value.data ||
    typeof value.data !== "object"
  )
    throw new Error("AIAGENT contract không tương thích (cần envelope 1.0.0).");
  return value.data;
}
export async function gatewayCatalog(provider, key) {
  const identity = expectedIdentity(provider);
  const data = await envelope(
    await fetch(`${validateEndpoint(provider.baseUrl)}/v1/ai/models`, {
      headers: gatewayHeaders(provider, key),
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    }),
  );
  if (
    data.authority !== "aiagent.iai.one" ||
    data.transport_origin !== identity.origin ||
    data.namespace !== AIAGENT_NAMESPACE ||
    !Array.isArray(data.models) ||
    !data.models.length ||
    data.count !== data.models.length
  )
    throw new Error("AIAGENT catalog không hợp lệ.");
  const seen = new Set();
  for (const model of data.models) {
    if (
      !model ||
      typeof model !== "object" ||
      !MODEL_PATTERN.test(model.id || "") ||
      seen.has(model.id) ||
      !["available", "unavailable"].includes(model.status) ||
      !Array.isArray(model.capabilities) ||
      model.capabilities.some((capability) => typeof capability !== "string")
    )
      throw new Error("AIAGENT catalog model/namespace không hợp lệ.");
    seen.add(model.id);
  }
  const models = data.models.filter((model) => model.status === "available");
  return {
    origin: data.transport_origin,
    namespace: data.namespace,
    chat: [
      ...new Set(
        models.filter((m) => m.capabilities.includes("chat")).map((m) => m.id),
      ),
    ].slice(0, 200),
    embedding: [
      ...new Set(
        models.filter((m) => m.capabilities.includes("embed")).map((m) => m.id),
      ),
    ].slice(0, 200),
  };
}
export async function gatewayInvoke(provider, key, request, signal) {
  // Defense in depth: the approved destination must be the verified AIAGENT
  // endpoint of this provider, never a caller-supplied host.
  const destination = new URL(validateEndpoint(request.destination));
  const identity = expectedIdentity(provider);
  const expectedPath =
    request.body.task_type === "embed" ? "/v1/ai/embed" : "/v1/ai/chat";
  if (
    destination.origin !== identity.origin ||
    destination.pathname !== expectedPath
  )
    throw new Error("Destination không khớp endpoint AIAGENT đã xác minh.");
  assertEgressAllowed(request.body);
  const data = await envelope(
    await fetch(destination.toString(), {
      method: "POST",
      headers: gatewayHeaders(provider, key, request.body.request_id),
      body: JSON.stringify(request.body),
      redirect: "error",
      signal: AbortSignal.any([signal, AbortSignal.timeout(90000)]),
    }),
  );
  if (
    data.provider !== AIAGENT_NAMESPACE ||
    data.request_id !== request.body.request_id ||
    data.model !== provider.model ||
    data.tenant_id !== identity.tenantId ||
    data.workspace_id !== identity.workspaceId ||
    data.policy_decision !== "allow" ||
    !data.run_id ||
    !data.receipt_id ||
    !data.ledger_entry_id ||
    data.billing_eligible !== true ||
    data.cost_status !== "authoritative_reconciled" ||
    data.cost_ledger_status !== "reconciled" ||
    !Number.isFinite(data.cost_usd) ||
    data.cost_usd < 0 ||
    data.cost_usd > 0.25 ||
    !validUsage(data.usage)
  )
    throw new Error(
      "AIAGENT response thiếu identity, usage hoặc authoritative cost ledger.",
    );
  const billing = await readBack(
    provider,
    key,
    data,
    request.body.request_id,
    signal,
  );
  if (request.body.task_type === "embed") {
    return {
      ...data,
      cost_usd: billing.cost_usd,
      billing_eligible: billing.billing_eligible,
      cost_status: billing.cost_status,
      cost_ledger_status: "reconciled",
      ledger_entry_id: billing.ledger_entry_id,
      billing,
    };
  }
  const calls = data.tool_calls || [];
  if (
    !Array.isArray(calls) ||
    calls.some(
      (c) =>
        typeof c.id !== "string" ||
        typeof c.name !== "string" ||
        !c.arguments ||
        typeof c.arguments !== "object" ||
        Array.isArray(c.arguments),
    )
  )
    throw new Error("AIAGENT tool-call contract không hợp lệ.");
  const message = {
    role: "assistant",
    content: typeof data.response === "string" ? data.response : null,
    ...(calls.length
      ? {
          tool_calls: calls.map((c) => ({
            id: c.id,
            type: "function",
            function: { name: c.name, arguments: JSON.stringify(c.arguments) },
          })),
        }
      : {}),
  };
  if (!message.content && !calls.length)
    throw new Error("Provider không trả nội dung hội thoại hợp lệ.");
  return {
    message,
    usage: data.usage
      ? {
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          total_tokens: data.usage.total_tokens,
        }
      : undefined,
    billing,
  };
}
function validUsage(usage) {
  return (
    usage &&
    Number.isSafeInteger(usage.input_tokens) &&
    usage.input_tokens >= 0 &&
    Number.isSafeInteger(usage.output_tokens) &&
    usage.output_tokens >= 0 &&
    Number.isSafeInteger(usage.total_tokens) &&
    usage.total_tokens === usage.input_tokens + usage.output_tokens &&
    usage.token_usage_status === "provider_reported"
  );
}
async function readBack(provider, key, data, requestId, signal) {
  const identity = expectedIdentity(provider);
  const billing = {
    receipt_id: data.receipt_id || null,
    run_id: data.run_id || null,
    request_id: requestId,
    ledger_entry_id: data.ledger_entry_id,
    billing_eligible: true,
    cost_usd: data.cost_usd,
    estimated_cost_usd: Number.isFinite(data.estimated_cost_usd)
      ? data.estimated_cost_usd
      : null,
    cost_status: "authoritative_reconciled",
    verified: true,
  };
  const options = {
    headers: gatewayHeaders(provider, key),
    signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    redirect: "error",
  };
  const response = await fetch(
    `${validateEndpoint(provider.baseUrl)}/v1/runs/${encodeURIComponent(billing.run_id)}`,
    options,
  );
  if (!response.ok)
    throw new Error(`AIAGENT run read-back HTTP ${response.status}.`);
  const runPayload = await response.json();
  const run = runPayload?.ok === true ? runPayload.run : null;
  const verifyId = `req_${randomUUID()}`;
  const verified = await envelope(
    await fetch(`${validateEndpoint(provider.baseUrl)}/v1/ai/verify`, {
      ...options,
      method: "POST",
      headers: gatewayHeaders(provider, key, verifyId),
      body: JSON.stringify({
        receipt_id: billing.receipt_id,
        ...policy("verify"),
        tenant_id: identity.tenantId,
        request_id: verifyId,
      }),
    }),
  );
  const receipt = verified.receipt;
  if (
    !run ||
    !receipt ||
    verified.receipt_id !== data.receipt_id ||
    verified.verified !== true ||
    verified.verification_method !== "ed25519-canonical-payload-sha256" ||
    verified.execution_status !== "success" ||
    run.status !== "success" ||
    receipt.authority !== "aiagent.iai.one" ||
    receipt.receipt_schema !== "aiagent.provider-receipt.v1" ||
    receipt.contract_version !== CONTRACT_VERSION
  )
    throw new Error("AIAGENT run/receipt verification chưa hợp lệ.");
  for (const [field, expected] of Object.entries({
    run_id: data.run_id,
    receipt_id: data.receipt_id,
    request_id: requestId,
    model: provider.model,
    tenant_id: identity.tenantId,
    workspace_id: identity.workspaceId,
    ledger_entry_id: data.ledger_entry_id,
    cost_usd: data.cost_usd,
    billing_eligible: true,
    cost_ledger_status: "reconciled",
  }))
    if (run[field] !== expected || receipt[field] !== expected)
      throw new Error(`AIAGENT reconciliation không khớp ${field}.`);
  if (
    run.input_tokens !== data.usage.input_tokens ||
    run.output_tokens !== data.usage.output_tokens ||
    receipt.input_tokens !== data.usage.input_tokens ||
    receipt.output_tokens !== data.usage.output_tokens
  )
    throw new Error("AIAGENT reconciliation không khớp usage.");
  billing.run_status = run.status;
  return billing;
}
