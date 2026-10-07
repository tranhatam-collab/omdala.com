import { apiJsonRequest } from "@/lib/api-client";

export const AIAGENT_CONTRACT_VERSION = "1.0.0";
export const AIAGENT_TENANT_ID = "omdala-com";

const LEGACY_ACCOUNT_KEY = "omcode:account";
const MODEL_PATTERN = /^iai-one\/[a-z0-9][a-z0-9-]{1,63}$/;

export interface AiagentModel {
  id: string;
  capabilities: string[];
  status: "available";
}

export interface AiagentCatalog {
  authority: {
    provider: "aiagent";
    configured: true;
    ready: true;
    origin: string;
    contractVersion: "1.0.0";
    tenant: "omdala-com";
    workspace: string;
    probe: "configuration-only";
    directUpstreamAllowed: false;
  };
  models: AiagentModel[];
  total: number;
}

export interface AiagentChatResult {
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
}

function objectValue(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isAiagentModelId(value: string): boolean {
  return MODEL_PATTERN.test(value);
}

export function clearLegacyAiBrowserState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_ACCOUNT_KEY);
  } catch {
    // A browser that blocks storage remains safe; no credential fallback exists.
  }
}

export async function getVerifiedAiagentCatalog(): Promise<AiagentCatalog> {
  clearLegacyAiBrowserState();
  const catalog = await apiJsonRequest<AiagentCatalog>(
    "/v1/ai/models",
    {
      method: "GET",
      credentials: "include",
      redirect: "error",
    },
    "Unable to load the verified AIAGENT catalog.",
  );
  if (
    catalog.authority?.provider !== "aiagent" ||
    catalog.authority.contractVersion !== AIAGENT_CONTRACT_VERSION ||
    catalog.authority.tenant !== AIAGENT_TENANT_ID ||
    catalog.authority.configured !== true ||
    catalog.authority.ready !== true ||
    catalog.authority.directUpstreamAllowed !== false ||
    !Array.isArray(catalog.models) ||
    catalog.models.length === 0 ||
    catalog.total !== catalog.models.length ||
    catalog.models.some(
      (model) =>
        !isAiagentModelId(model.id) ||
        model.status !== "available" ||
        !Array.isArray(model.capabilities),
    )
  ) {
    throw new Error("AIAGENT_CATALOG_PROXY_INVALID");
  }
  return catalog;
}

export async function chatViaAiagent(input: {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  maxTokens?: number;
}): Promise<AiagentChatResult> {
  if (!isAiagentModelId(input.model)) {
    throw new Error("AIAGENT_MODEL_NAMESPACE_REQUIRED");
  }
  const idempotencyKey = `omdala-browser-${crypto.randomUUID()}`;
  const result = await apiJsonRequest<AiagentChatResult>(
    "/v1/ai/chat",
    {
      method: "POST",
      credentials: "include",
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        maxTokens: Math.min(Math.max(Math.trunc(input.maxTokens ?? 1024), 1), 2048),
      }),
    },
    "AIAGENT request failed or could not be reconciled.",
  );
  if (
    !objectValue(result) ||
    typeof result.response !== "string" ||
    !result.response.trim() ||
    result.model !== input.model ||
    result.tenant_id !== AIAGENT_TENANT_ID ||
    typeof result.workspace_id !== "string" ||
    !result.workspace_id ||
    typeof result.request_id !== "string" ||
    !result.request_id ||
    typeof result.run_id !== "string" ||
    !result.run_id ||
    typeof result.receipt_id !== "string" ||
    !result.receipt_id ||
    typeof result.ledger_entry_id !== "string" ||
    !result.ledger_entry_id ||
    result.billing_eligible !== true ||
    result.cost_ledger_status !== "reconciled" ||
    typeof result.cost_usd !== "number" ||
    !Number.isFinite(result.cost_usd) ||
    result.cost_usd < 0 ||
    !objectValue(result.usage) ||
    !Number.isSafeInteger(result.usage.input_tokens) ||
    !Number.isSafeInteger(result.usage.output_tokens) ||
    result.usage.total_tokens !==
      result.usage.input_tokens + result.usage.output_tokens
  ) {
    throw new Error("AIAGENT_PROXY_RECEIPT_INVALID");
  }
  return result;
}
