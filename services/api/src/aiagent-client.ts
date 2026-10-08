import type { ApiBindings } from "./contracts";

export const AIAGENT_CONTRACT_VERSION = "1.0.0";
export const AIAGENT_TENANT_ID = "omdala-com";

const AIAGENT_ORIGINS = {
  production: "https://api.aiagent.iai.one",
  staging: "https://staging-api.aiagent.iai.one",
} as const;

const AIAGENT_WORKSPACES = {
  production: "omdala-com-production",
  staging: "omdala-com-staging",
} as const;

const PROVIDER_TIMEOUT_MS = 60_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MODEL_ID_PATTERN = /^iai-one\/[a-z0-9][a-z0-9-]{1,63}$/;
const CREDENTIAL_PATTERN = /^sk-aiagent-[a-f0-9]{48}$/;

type ReleaseEnvironment = keyof typeof AIAGENT_ORIGINS;
type JsonObject = Record<string, unknown>;

export type AiagentCatalogModel = {
  id: string;
  capabilities: string[];
  status: "available";
};

export type AiagentChatInput = {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  maxTokens: number;
};

export type AiagentChatResult = {
  response: string;
  model: string;
  request_id: string;
  tenant_id: "omdala-com";
  workspace_id: string;
  run_id: string;
  receipt_id: string;
  ledger_entry_id: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  cost_usd: number;
  billing_eligible: true;
  cost_ledger_status: "reconciled";
};

function objectValue(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function environmentValue(value: string | undefined): ReleaseEnvironment | null {
  return value === "production" || value === "staging" ? value : null;
}

function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function expectedRuntimeIdentity(env: ApiBindings): {
  environment: ReleaseEnvironment;
  origin: string;
  workspace: string;
} | null {
  const environment = environmentValue(env.ENVIRONMENT);
  if (!environment) return null;
  const origin = AIAGENT_ORIGINS[environment];
  if (
    normalizeOrigin(env.AIAGENT_API_URL) !== origin ||
    env.AIAGENT_WORKSPACE_ID !== AIAGENT_WORKSPACES[environment]
  ) {
    return null;
  }
  return {
    environment,
    origin,
    workspace: AIAGENT_WORKSPACES[environment],
  };
}

function runtimeCredential(env: ApiBindings): string | null {
  // Resolve and validate the exact destination before reading the secret.
  if (!expectedRuntimeIdentity(env)) return null;
  const credential = env.AIAGENT_API_KEY?.trim() ?? "";
  return CREDENTIAL_PATTERN.test(credential) ? credential : null;
}

export function getAiagentAuthority(env: ApiBindings) {
  const identity = expectedRuntimeIdentity(env);
  return {
    provider: "aiagent" as const,
    configured: Boolean(identity),
    ready: Boolean(identity && runtimeCredential(env)),
    origin: identity?.origin ?? null,
    contractVersion: AIAGENT_CONTRACT_VERSION,
    tenant: AIAGENT_TENANT_ID,
    workspace: identity?.workspace ?? null,
    probe: "configuration-only" as const,
    directUpstreamAllowed: false,
  };
}

async function boundedJson(response: Response): Promise<JsonObject> {
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    await response.body?.cancel();
    throw new Error("AIAGENT_JSON_REQUIRED");
  }
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw new Error("AIAGENT_RESPONSE_TOO_LARGE");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("AIAGENT_JSON_INVALID");
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_RESPONSE_BYTES) {
        await reader.cancel("AIAGENT_RESPONSE_TOO_LARGE");
        throw new Error("AIAGENT_RESPONSE_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let body: string;
  try {
    body = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("AIAGENT_JSON_INVALID");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error("AIAGENT_JSON_INVALID");
  }
  if (!objectValue(parsed)) throw new Error("AIAGENT_JSON_INVALID");
  return parsed;
}

async function requestAiagentJson(
  env: ApiBindings,
  path: string,
  init: RequestInit,
  options: { requireContract?: boolean; expectedRequestId?: string } = {},
): Promise<JsonObject> {
  const identity = expectedRuntimeIdentity(env);
  if (!identity) throw new Error("AIAGENT_DESTINATION_NOT_CONFIGURED");
  const credential = runtimeCredential(env);
  if (!credential) throw new Error("AIAGENT_CREDENTIAL_NOT_CONFIGURED");
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("AIAGENT_PATH_INVALID");
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${credential}`);
  // These are bounded policy selections, never trusted authority. AIAGENT
  // strips them at ingress, checks them against the credential, and then
  // rebuilds the internal identity headers from the credential record.
  headers.set("X-Tenant-ID", AIAGENT_TENANT_ID);
  headers.set("X-Workspace-ID", identity.workspace);
  headers.set("X-Actor-Role", "agent");
  headers.set("X-Surface", "agent");

  const response = await fetch(`${identity.origin}${path}`, {
    ...init,
    redirect: "error",
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers,
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`AIAGENT_HTTP_${response.status}`);
  }
  if (
    options.expectedRequestId &&
    (response.headers.get("X-Request-ID") !== options.expectedRequestId ||
      response.headers.get("X-Trace-ID") !== options.expectedRequestId)
  ) {
    await response.body?.cancel();
    throw new Error("AIAGENT_TRANSPORT_CORRELATION_MISMATCH");
  }
  if (
    response.headers.get("X-Provider-Contract-Version") !==
    AIAGENT_CONTRACT_VERSION
  ) {
    await response.body?.cancel();
    throw new Error("AIAGENT_TRANSPORT_CONTRACT_MISMATCH");
  }
  const payload = await boundedJson(response);
  if (payload.ok !== true) throw new Error("AIAGENT_BUSINESS_SUCCESS_REQUIRED");
  if (
    options.requireContract !== false &&
    payload.contract_version !== AIAGENT_CONTRACT_VERSION
  ) {
    throw new Error("AIAGENT_CONTRACT_VERSION_MISMATCH");
  }
  return payload;
}

function validateCatalog(
  payload: JsonObject,
  env: ApiBindings,
): AiagentCatalogModel[] {
  const identity = expectedRuntimeIdentity(env);
  const data = payload.data;
  if (
    !identity ||
    !objectValue(data) ||
    data.authority !== "aiagent.iai.one" ||
    data.transport_origin !== identity.origin ||
    data.namespace !== "iai-one" ||
    !Array.isArray(data.models) ||
    data.models.length === 0 ||
    data.count !== data.models.length
  ) {
    throw new Error("AIAGENT_CATALOG_IDENTITY_INVALID");
  }

  const seen = new Set<string>();
  const available: AiagentCatalogModel[] = [];
  for (const entry of data.models) {
    if (
      !objectValue(entry) ||
      typeof entry.id !== "string" ||
      !MODEL_ID_PATTERN.test(entry.id) ||
      seen.has(entry.id) ||
      !Array.isArray(entry.capabilities) ||
      entry.capabilities.some((capability) => typeof capability !== "string") ||
      (entry.status !== "available" && entry.status !== "unavailable")
    ) {
      throw new Error("AIAGENT_CATALOG_ENTRY_INVALID");
    }
    seen.add(entry.id);
    if (entry.status === "available") {
      available.push({
        id: entry.id,
        capabilities: entry.capabilities as string[],
        status: "available",
      });
    }
  }
  if (!available.some((model) => model.capabilities.includes("chat"))) {
    throw new Error("AIAGENT_CHAT_CATALOG_UNAVAILABLE");
  }
  return available;
}

export async function listAiagentModels(env: ApiBindings): Promise<AiagentCatalogModel[]> {
  const payload = await requestAiagentJson(env, "/v1/ai/models", {
    method: "GET",
  });
  return validateCatalog(payload, env);
}

async function correlatedRequestId(email: string, idempotencyKey: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${email.trim().toLowerCase()}:${idempotencyKey}`),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `omdala-web-${hex}`;
}

function requiredString(object: JsonObject, key: string): string {
  const value = object[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`AIAGENT_REQUIRED_FIELD_${key.toUpperCase()}`);
  }
  return value;
}

function validateUsage(value: unknown): {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
} {
  if (!objectValue(value)) throw new Error("AIAGENT_USAGE_INVALID");
  const input = value.input_tokens;
  const output = value.output_tokens;
  const total = value.total_tokens;
  if (
    !Number.isSafeInteger(input) ||
    Number(input) < 0 ||
    !Number.isSafeInteger(output) ||
    Number(output) < 0 ||
    !Number.isSafeInteger(total) ||
    Number(total) !== Number(input) + Number(output)
  ) {
    throw new Error("AIAGENT_USAGE_INVALID");
  }
  return {
    input_tokens: Number(input),
    output_tokens: Number(output),
    total_tokens: Number(total),
  };
}

const LEDGER_PROVENANCE_FIELDS = [
  "ledger_release_sha",
  "ledger_version_id",
  "ledger_deployment_id",
  "ledger_bundle_sha256",
  "ledger_contract_version",
  "ledger_schema_version",
  "ledger_migration_sha256",
] as const;

function validateChatInvocation(
  value: unknown,
  input: AiagentChatInput,
  requestId: string,
  workspace: string,
): AiagentChatResult & JsonObject {
  if (!objectValue(value)) throw new Error("AIAGENT_CHAT_RESPONSE_INVALID");
  const usage = validateUsage(value.usage);
  if (
    typeof value.response !== "string" ||
    !value.response.trim() ||
    value.model !== input.model ||
    value.provider !== "iai-one" ||
    value.request_id !== requestId ||
    value.tenant_id !== AIAGENT_TENANT_ID ||
    value.workspace_id !== workspace ||
    value.billing_eligible !== true ||
    value.cost_ledger_status !== "reconciled" ||
    value.fallback_used !== false ||
    (Array.isArray(value.fallback_chain) && value.fallback_chain.length !== 0) ||
    typeof value.cost_usd !== "number" ||
    !Number.isFinite(value.cost_usd) ||
    value.cost_usd < 0 ||
    value.cost_usd > 0.25
  ) {
    throw new Error("AIAGENT_CHAT_RECONCILIATION_INVALID");
  }
  for (const field of LEDGER_PROVENANCE_FIELDS) requiredString(value, field);
  if (value.ledger_deployment_id !== value.ledger_version_id) {
    throw new Error("AIAGENT_LEDGER_VERSION_MISMATCH");
  }
  const budget = value.budget;
  if (
    !objectValue(budget) ||
    typeof budget.limit_usd !== "number" ||
    budget.limit_usd <= 0 ||
    budget.limit_usd > 0.25 ||
    typeof budget.used_usd !== "number" ||
    typeof budget.reserved_usd !== "number" ||
    budget.reserved_usd < 0 ||
    budget.used_usd < budget.reserved_usd ||
    value.cost_usd > budget.limit_usd ||
    value.cost_usd > budget.used_usd ||
    typeof budget.remaining_usd !== "number" ||
    budget.used_usd < 0 ||
    budget.remaining_usd < 0 ||
    Math.abs(budget.used_usd + budget.remaining_usd - budget.limit_usd) > 1e-9 ||
    budget.reservation_basis !== "configured_rate_conservative_ceiling"
  ) {
    throw new Error("AIAGENT_BUDGET_RECONCILIATION_INVALID");
  }
  const quota = value.request_quota;
  if (
    !objectValue(quota) ||
    quota.scope !== "api-key-lifetime" ||
    !Number.isSafeInteger(quota.limit) ||
    !Number.isSafeInteger(quota.used) ||
    !Number.isSafeInteger(quota.remaining) ||
    Number(quota.used) + Number(quota.remaining) !== Number(quota.limit)
  ) {
    throw new Error("AIAGENT_QUOTA_RECONCILIATION_INVALID");
  }

  return {
    ...value,
    response: value.response,
    model: value.model,
    request_id: requestId,
    tenant_id: AIAGENT_TENANT_ID,
    workspace_id: workspace,
    run_id: requiredString(value, "run_id"),
    receipt_id: requiredString(value, "receipt_id"),
    ledger_entry_id: requiredString(value, "ledger_entry_id"),
    usage,
    cost_usd: value.cost_usd,
    billing_eligible: true,
    cost_ledger_status: "reconciled",
  };
}

function validateRunReadback(run: unknown, invocation: AiagentChatResult): void {
  if (
    !objectValue(run) ||
    run.run_id !== invocation.run_id ||
    run.receipt_id !== invocation.receipt_id ||
    run.request_id !== invocation.request_id ||
    run.model !== invocation.model ||
    run.tenant_id !== invocation.tenant_id ||
    run.workspace_id !== invocation.workspace_id ||
    run.status !== "success" ||
    run.input_tokens !== invocation.usage.input_tokens ||
    run.output_tokens !== invocation.usage.output_tokens ||
    run.cost_usd !== invocation.cost_usd ||
    run.billing_eligible !== true
  ) {
    throw new Error("AIAGENT_RUN_READBACK_MISMATCH");
  }
}

function validateReceiptReadback(
  verification: JsonObject,
  invocation: AiagentChatResult & JsonObject,
): void {
  const data = verification.data;
  const receipt = objectValue(data) ? data.receipt : null;
  if (
    !objectValue(data) ||
    data.verified !== true ||
    data.execution_status !== "success" ||
    !objectValue(receipt) ||
    receipt.receipt_id !== invocation.receipt_id ||
    receipt.run_id !== invocation.run_id ||
    receipt.request_id !== invocation.request_id ||
    receipt.model !== invocation.model ||
    receipt.tenant_id !== invocation.tenant_id ||
    receipt.workspace_id !== invocation.workspace_id ||
    receipt.input_tokens !== invocation.usage.input_tokens ||
    receipt.output_tokens !== invocation.usage.output_tokens ||
    receipt.cost_usd !== invocation.cost_usd ||
    receipt.ledger_entry_id !== invocation.ledger_entry_id ||
    receipt.billing_eligible !== true
    || receipt.cost_ledger_status !== "reconciled"
    || typeof receipt.provider !== "string"
    || !receipt.provider
    || receipt.provider === "iai-one"
  ) {
    throw new Error("AIAGENT_VERIFY_RECONCILIATION_MISMATCH");
  }
  for (const field of LEDGER_PROVENANCE_FIELDS) {
    if (receipt[field] !== invocation[field]) {
      throw new Error("AIAGENT_VERIFY_RECONCILIATION_MISMATCH");
    }
  }
}

export async function executeAiagentChat(
  env: ApiBindings,
  email: string,
  idempotencyKey: string,
  input: AiagentChatInput,
): Promise<AiagentChatResult> {
  const identity = expectedRuntimeIdentity(env);
  if (!identity || !runtimeCredential(env)) {
    throw new Error("AIAGENT_RUNTIME_NOT_CONFIGURED");
  }
  if (
    !MODEL_ID_PATTERN.test(input.model) ||
    !Number.isSafeInteger(input.maxTokens) ||
    input.maxTokens < 1 ||
    input.maxTokens > 2048 ||
    input.messages.length === 0 ||
    input.messages.length > 20 ||
    input.messages.some(
      (message) =>
        !["system", "user", "assistant"].includes(message.role) ||
        !message.content.trim() ||
        message.content.length > 20_000,
    ) ||
    input.messages.reduce((total, message) => total + message.content.length, 0) > 100_000
  ) {
    throw new Error("AIAGENT_CHAT_INPUT_INVALID");
  }

  const catalog = await listAiagentModels(env);
  const selected = catalog.find(
    (model) => model.id === input.model && model.capabilities.includes("chat"),
  );
  if (!selected) throw new Error("AIAGENT_MODEL_NOT_AVAILABLE");

  const requestId = await correlatedRequestId(email, idempotencyKey);
  const invocationPayload = await requestAiagentJson(env, "/v1/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": requestId,
      "X-Request-ID": requestId,
      "X-Trace-ID": requestId,
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      max_tokens: input.maxTokens,
      temperature: 0,
      task_type: "chat",
      risk_level: "low",
      data_sensitivity: "internal",
      tenant_id: AIAGENT_TENANT_ID,
      request_id: requestId,
    }),
  }, { expectedRequestId: requestId });
  const invocation = validateChatInvocation(
    invocationPayload.data,
    input,
    requestId,
    identity.workspace,
  );

  const runPayload = await requestAiagentJson(
    env,
    `/v1/runs/${encodeURIComponent(invocation.run_id)}`,
    {
      method: "GET",
      headers: {
        "X-Request-ID": `${requestId}-run`,
        "X-Trace-ID": `${requestId}-run`,
      },
    },
    { requireContract: false, expectedRequestId: `${requestId}-run` },
  );
  validateRunReadback(runPayload.run, invocation);

  const verification = await requestAiagentJson(env, "/v1/ai/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `${requestId}-verify`,
      "X-Request-ID": `${requestId}-verify`,
      "X-Trace-ID": `${requestId}-verify`,
    },
    body: JSON.stringify({
      receipt_id: invocation.receipt_id,
      task_type: "verify",
      risk_level: "low",
      data_sensitivity: "internal",
      tenant_id: AIAGENT_TENANT_ID,
    }),
  }, { expectedRequestId: `${requestId}-verify` });
  validateReceiptReadback(verification, invocation);

  return {
    response: invocation.response,
    model: invocation.model,
    request_id: invocation.request_id,
    tenant_id: invocation.tenant_id,
    workspace_id: invocation.workspace_id,
    run_id: invocation.run_id,
    receipt_id: invocation.receipt_id,
    ledger_entry_id: invocation.ledger_entry_id,
    usage: invocation.usage,
    cost_usd: invocation.cost_usd,
    billing_eligible: true,
    cost_ledger_status: "reconciled",
  };
}
