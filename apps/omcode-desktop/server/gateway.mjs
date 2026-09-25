import { randomUUID } from "node:crypto";
import { assertEgressAllowed } from "./egress-policy.mjs";

export const CONTRACT_VERSION = "1.0.0";
export const policy = (task_type) => ({
  task_type,
  risk_level: "low",
  data_sensitivity: "internal",
});
export function gatewayHeaders(provider, key, requestId) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    "X-Actor-Role": "agent",
    "X-Surface": "agent",
    ...(provider.tenantId ? { "X-Tenant-ID": provider.tenantId } : {}),
    ...(provider.workspaceId ? { "X-Workspace-Id": provider.workspaceId } : {}),
    ...(requestId
      ? { "X-Request-ID": requestId, "Idempotency-Key": requestId }
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
  const data = await envelope(
    await fetch(`${provider.baseUrl}/v1/ai/models`, {
      headers: gatewayHeaders(provider, key),
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    }),
  );
  if (!Array.isArray(data.models))
    throw new Error("AIAGENT catalog không hợp lệ.");
  const models = data.models.filter(
    (m) =>
      typeof m.id === "string" &&
      m.status === "available" &&
      Array.isArray(m.capabilities),
  );
  return {
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
  assertEgressAllowed(request.body);
  const data = await envelope(
    await fetch(request.destination, {
      method: "POST",
      headers: gatewayHeaders(provider, key, request.body.request_id),
      body: JSON.stringify(request.body),
      redirect: "error",
      signal: AbortSignal.any([signal, AbortSignal.timeout(90000)]),
    }),
  );
  if (
    data.request_id !== request.body.request_id ||
    data.model !== provider.model
  )
    throw new Error("AIAGENT response không khớp request/model đã duyệt.");
  if (request.body.task_type === "embed") return data;
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
    billing: await readBack(
      provider,
      key,
      data,
      request.body.request_id,
      signal,
    ),
  };
}
async function readBack(provider, key, data, requestId, signal) {
  const billing = {
    receipt_id: data.receipt_id || null,
    run_id: data.run_id || null,
    request_id: requestId,
    ledger_entry_id: null,
    billing_eligible: false,
    cost_usd: null,
    estimated_cost_usd: Number.isFinite(data.estimated_cost_usd)
      ? data.estimated_cost_usd
      : null,
    cost_status: "unverified",
    verified: false,
    readback_error: null,
  };
  try {
    if (!billing.run_id || !billing.receipt_id)
      throw new Error("Thiếu run/receipt identity.");
    const options = {
      headers: gatewayHeaders(provider, key),
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
      redirect: "error",
    };
    const response = await fetch(
      `${provider.baseUrl}/v1/runs/${encodeURIComponent(billing.run_id)}`,
      options,
    );
    if (!response.ok) throw new Error(`run read-back HTTP ${response.status}`);
    const run = (await response.json()).run;
    const verifyId = `req_${randomUUID()}`;
    const verified = await envelope(
      await fetch(`${provider.baseUrl}/v1/ai/verify`, {
        ...options,
        method: "POST",
        headers: gatewayHeaders(provider, key, verifyId),
        body: JSON.stringify({
          receipt_id: billing.receipt_id,
          ...policy("verify"),
          request_id: verifyId,
        }),
      }),
    );
    const receipt = verified.receipt;
    if (
      !run ||
      !receipt ||
      verified.verified !== true ||
      run.status !== "success"
    )
      throw new Error("Run/receipt chưa verified thành công.");
    for (const [field, expected] of Object.entries({
      run_id: data.run_id,
      receipt_id: data.receipt_id,
      request_id: requestId,
      model: provider.model,
    }))
      if (run[field] !== expected || receipt[field] !== expected)
        throw new Error(`Read-back không khớp ${field}.`);
    for (const field of ["tenant_id", "workspace_id"]) {
      const configured =
        field === "tenant_id" ? provider.tenantId : provider.workspaceId;
      if (
        !data[field] ||
        run[field] !== data[field] ||
        receipt[field] !== data[field] ||
        (configured && configured !== data[field])
      )
        throw new Error(`Read-back không khớp ${field}.`);
    }
    if (
      data.ledger_entry_id !== receipt.ledger_entry_id ||
      data.cost_usd !== receipt.cost_usd ||
      data.billing_eligible !== receipt.billing_eligible
    )
      throw new Error("Read-back không khớp cost/ledger.");
    billing.verified = true;
    billing.run_status = run.status;
    billing.ledger_entry_id = receipt.ledger_entry_id || null;
    billing.cost_status = "no_ledger_not_billable";
    if (
      receipt.billing_eligible === true &&
      receipt.ledger_entry_id &&
      receipt.cost_ledger_status === "reconciled" &&
      Number.isFinite(receipt.cost_usd) &&
      receipt.cost_usd >= 0
    ) {
      billing.billing_eligible = true;
      billing.cost_usd = receipt.cost_usd;
      billing.cost_status = "authoritative_reconciled";
    }
  } catch (error) {
    billing.cost_status = "readback_failed";
    billing.readback_error = error.message;
  }
  return billing;
}
