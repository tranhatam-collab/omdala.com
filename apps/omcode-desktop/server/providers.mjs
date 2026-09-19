import fs from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { execute } from "./local.mjs";
import { assertEgressAllowed } from "./egress-policy.mjs";

export const IMPORT_TARGETS = {
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-flash",
  },
  cerebras: {
    name: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    model: "gpt-oss-120b",
  },
  google: {
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3.8-flash",
  },
};
export function validateEndpoint(value) {
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash)
    throw new Error(
      "URL provider không được chứa thông tin đăng nhập hoặc query.",
    );
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local))
    throw new Error("Provider cần HTTPS; HTTP chỉ dành cho model local.");
  return url.toString().replace(/\/$/, "");
}
export function normalizeModelId(baseUrl, id) {
  return new URL(baseUrl).hostname === "generativelanguage.googleapis.com"
    ? id.replace(/^models\//, "")
    : id;
}
function detectKind(baseUrl, kind) {
  if (kind === "iai-one" || kind === "openai") return kind;
  try {
    return new URL(baseUrl).hostname === "api.aiagent.iai.one"
      ? "iai-one"
      : "openai";
  } catch {
    return "openai";
  }
}
async function secret(action, id, value) {
  const binary =
    process.env.OMCODE_KEYCHAIN_PATH || process.env.OMCODE_NATIVE_PATH;
  if (!binary) {
    if (action === "get") {
      const scoped =
        process.env[
          `OMCODE_TEST_API_KEY_${String(id).toUpperCase().replace(/[^A-Z0-9]/g, "_")}`
        ];
      if (scoped) return scoped;
      if (process.env.OMCODE_TEST_API_KEY) return process.env.OMCODE_TEST_API_KEY;
      return "";
    }
    throw new Error("Hãy mở bản OMCODE.app để lưu khóa vào macOS Keychain.");
  }
  const r = await execute(binary, [`--keychain-${action}`, id], {
    input: value || "",
    timeout: 10000,
  });
  if (r.code !== 0) {
    if (action === "get" && r.code === 3) return "";
    if (action === "get")
      throw new Error(
        "OMCODE chưa đọc được Keychain. Kiểm tra quyền truy cập khóa trong Kết nối; chưa gửi yêu cầu AI.",
      );
    throw new Error("Không lưu được khóa vào macOS Keychain.");
  }
  return r.stdout.trim();
}
// A short non-reversible identifier for the current credential. The key
// material itself never enters provider state, run history or receipts.
export function credentialFingerprint(key) {
  return key ? createHash("sha256").update(String(key)).digest("hex").slice(0, 16) : null;
}
export async function saveProvider(store, input) {
  const providers = store.get("providers", []);
  const id = input.id || randomUUID();
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id))
    throw new Error("Provider ID không hợp lệ.");
  const existing = providers.find((p) => p.id === id);
  const baseUrl = validateEndpoint(input.baseUrl);
  const provider = {
    id,
    name: String(input.name || "Provider").slice(0, 80),
    baseUrl,
    kind: detectKind(baseUrl, input.kind),
    model: String(input.model || "").slice(0, 160),
    models: existing?.models || [],
    catalog: existing?.catalog || null,
    embeddingModels: existing?.embeddingModels || [],
    credentialRevision: existing?.credentialRevision || 0,
    tenantId: /^[a-zA-Z0-9_-]{1,80}$/.test(input.tenantId || "")
      ? input.tenantId
      : existing?.tenantId || null,
    workspaceId: /^[a-zA-Z0-9_-]{1,80}$/.test(input.workspaceId || "")
      ? input.workspaceId
      : existing?.workspaceId || null,
    status: "not_checked",
  };
  if (input.apiKey) {
    await secret("set", id, input.apiKey);
    // A credential change invalidates any catalog verified under the old key.
    provider.credentialRevision += 1;
    provider.catalog = null;
    provider.models = [];
    provider.embeddingModels = [];
  }
  const next = providers.filter((p) => p.id !== id).concat(provider);
  store.set("providers", next);
  return provider;
}
export async function importProviders(store) {
  let auth;
  try {
    auth = JSON.parse(
      await fs.readFile(
        `${process.env.HOME}/.openclaw/agents/main/agent/auth-profiles.json`,
        "utf8",
      ),
    );
  } catch {
    return { imported: [], unavailable: true };
  }
  const imported = [];
  for (const [id, target] of Object.entries(IMPORT_TARGETS)) {
    if (store.get("providers", []).some((p) => p.id === id)) continue;
    const profile = Object.values(auth.profiles || {}).find(
      (p) => p.type === "api_key" && p.provider === id && p.key,
    );
    if (!profile) continue;
    await saveProvider(store, { id, ...target, apiKey: profile.key });
    imported.push(id);
  }
  return { imported };
}
export async function providerKey(id) {
  return secret("get", id);
}
function providerHeaders(provider, key, extra = {}) {
  return {
    "Content-Type": "application/json",
    ...(key ? { Authorization: `Bearer ${key}` } : {}),
    ...(provider.kind === "iai-one"
      ? {
          "X-Tenant-ID": provider.tenantId || "aiagent",
          "X-Workspace-Id": provider.workspaceId || "omcode",
          ...extra,
        }
      : extra),
  };
}
async function fetchGatewayModels(provider, key) {
  const response = await fetch(`${provider.baseUrl}/v1/ai/models`, {
    headers: providerHeaders(provider, key),
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const models = Array.isArray(data.models) ? data.models : [];
  const chat = [];
  const embedding = [];
  for (const model of models) {
    if (typeof model?.id !== "string") continue;
    const capabilities = Array.isArray(model.capabilities)
      ? model.capabilities
      : [];
    if (capabilities.includes("chat")) chat.push(model.id);
    else if (capabilities.includes("embed")) embedding.push(model.id);
  }
  return { chat: chat.slice(0, 200), embedding: embedding.slice(0, 200) };
}
async function fetchOpenAIModels(provider, key) {
  const response = await fetch(`${provider.baseUrl}/models`, {
    headers: providerHeaders(provider, key),
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return (data.data || [])
    .map((m) => m.id)
    .filter((x) => typeof x === "string")
    .map((id) => normalizeModelId(provider.baseUrl, id))
    .slice(0, 200);
}
export async function checkProvider(store, id) {
  const providers = store.get("providers", []);
  const provider = providers.find((p) => p.id === id);
  if (!provider) throw new Error("Không tìm thấy provider.");
  try {
    const key = await providerKey(id);
    if (!key && (IMPORT_TARGETS[id] || provider.kind === "iai-one"))
      throw new Error(
        "Chưa có API key cho provider này trong OMCODE Keychain.",
      );
    const kind = provider.kind || detectKind(provider.baseUrl);
    let models;
    let embedding = [];
    if (kind === "iai-one") {
      const catalog = await fetchGatewayModels(provider, key);
      models = catalog.chat;
      embedding = catalog.embedding;
    } else models = await fetchOpenAIModels(provider, key);
    if (!models.length) throw new Error("Provider không trả danh sách model.");
    provider.models = models;
    provider.embeddingModels = embedding;
    provider.model = normalizeModelId(provider.baseUrl, provider.model);
    if (!provider.models.includes(provider.model))
      provider.model = provider.models[0];
    // Catalog is only usable while this exact credential stays in place.
    provider.catalog = {
      models: provider.models,
      fingerprint: credentialFingerprint(key),
      revision: provider.credentialRevision || 0,
      checkedAt: Date.now(),
    };
    provider.status = "connected";
    provider.error = null;
    provider.checkedAt = Date.now();
  } catch (error) {
    // A failed check invalidates the previous catalog: it can no longer be
    // tied to a verified credential.
    provider.catalog = null;
    provider.status = "error";
    provider.error =
      error.name === "TimeoutError" ? "Kết nối quá 15 giây." : error.message;
  }
  store.set("providers", providers);
  return provider;
}
function assertCatalogCurrent(provider, key) {
  const credentialed =
    Boolean(key) || IMPORT_TARGETS[provider.id] || provider.kind === "iai-one";
  if (!credentialed) return;
  const catalog = provider.catalog;
  const revision = provider.credentialRevision || 0;
  if (
    !catalog ||
    catalog.fingerprint !== credentialFingerprint(key) ||
    catalog.revision !== revision ||
    !Array.isArray(catalog.models) ||
    !catalog.models.length
  )
    throw new Error(
      "Catalog chưa gắn với credential hiện tại. Chạy Kiểm tra trong Kết nối trước khi gửi yêu cầu AI.",
    );
  // Model fallback is only allowed inside the credential-verified catalog.
  if (!catalog.models.includes(provider.model))
    throw new Error(
      `Model ${provider.model} không nằm trong catalog đã xác minh cho credential này.`,
    );
}
async function gatewayChat(provider, key, messages, tools, signal) {
  const requestId = `req_${randomUUID()}`;
  const body = {
    model: provider.model,
    messages,
    task_type: "agent-task",
    ...(tools.length ? { tools } : {}),
  };
  assertEgressAllowed(body);
  const request = {
    method: "POST",
    headers: providerHeaders(provider, key, { "X-Request-ID": requestId }),
    body: JSON.stringify(body),
    signal: AbortSignal.any([signal, AbortSignal.timeout(90000)]),
    redirect: "error",
  };
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(`${provider.baseUrl}/v1/ai/chat`, request);
    if (![502, 503, 504].includes(response.status) || attempt === 2) break;
    await response.body?.cancel();
    const retryAfter = Number(response.headers.get("retry-after"));
    await delay(
      Math.min(5000, retryAfter > 0 ? retryAfter * 1000 : (attempt + 1) * 1000),
      undefined,
      { signal },
    );
  }
  if (!response.ok) {
    const error = new Error(
      `Provider ${provider.name}: HTTP ${response.status}. Kiểm tra model, quyền truy cập và hạn mức trong Kết nối.`,
    );
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  const message = {
    role: "assistant",
    content: typeof data.response === "string" ? data.response : null,
    ...(Array.isArray(data.tool_calls) && data.tool_calls.length
      ? { tool_calls: data.tool_calls }
      : {}),
  };
  if (!message.content && !message.tool_calls)
    throw new Error("Provider không trả nội dung hội thoại hợp lệ.");
  const usage = data.usage
    ? {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.total_tokens,
      }
    : undefined;
  const billing = await gatewayReadBack(provider, key, data, requestId, signal);
  return { message, usage, billing };
}
async function gatewayReadBack(provider, key, data, requestId, signal) {
  const billing = {
    receipt_id: data.receipt_id || null,
    run_id: data.run_id || null,
    request_id: data.request_id || requestId,
    ledger_entry_id: data.ledger_entry_id || null,
    billing_eligible: Boolean(data.billing_eligible),
    cost_usd: null,
    estimated_cost_usd:
      typeof data.estimated_cost_usd === "number"
        ? data.estimated_cost_usd
        : null,
    cost_status: "unverified",
    verified: false,
    readback_error: null,
  };
  // Billable cost requires an authoritative ledger entry AND authenticated
  // run/receipt read-back. Anything less stays explicitly unverified.
  if (!billing.receipt_id && !billing.run_id) return billing;
  try {
    if (billing.run_id) {
      const runResponse = await fetch(
        `${provider.baseUrl}/v1/runs/${encodeURIComponent(billing.run_id)}`,
        {
          headers: providerHeaders(provider, key),
          signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
          redirect: "error",
        },
      );
      if (!runResponse.ok)
        throw new Error(`run read-back HTTP ${runResponse.status}`);
      const runData = await runResponse.json();
      const run = runData?.run;
      if (!run || (run.id && run.id !== billing.run_id))
        throw new Error("run read-back không khớp run_id");
      billing.run_status = run.status || null;
    }
    if (billing.receipt_id) {
      const verifyResponse = await fetch(`${provider.baseUrl}/v1/ai/verify`, {
        method: "POST",
        headers: providerHeaders(provider, key),
        body: JSON.stringify({ receipt_id: billing.receipt_id }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
        redirect: "error",
      });
      if (!verifyResponse.ok)
        throw new Error(`receipt verify HTTP ${verifyResponse.status}`);
      const verifyData = await verifyResponse.json();
      if (verifyData.verified !== true)
        throw new Error("receipt read-back không verified");
      const receipt = verifyData.receipt || {};
      if (
        receipt.receipt_id &&
        receipt.receipt_id !== billing.receipt_id
      )
        throw new Error("receipt read-back không khớp receipt_id");
      if (
        billing.ledger_entry_id &&
        receipt.ledger_entry_id &&
        receipt.ledger_entry_id !== billing.ledger_entry_id
      )
        throw new Error("receipt read-back không khớp ledger_entry_id");
      if (!billing.ledger_entry_id && receipt.ledger_entry_id)
        billing.ledger_entry_id = receipt.ledger_entry_id;
    }
    billing.verified = true;
    if (billing.ledger_entry_id && typeof data.cost_usd === "number") {
      billing.cost_usd = data.cost_usd;
      billing.cost_status = "authoritative_reconciled";
    } else if (billing.ledger_entry_id) {
      billing.cost_status = "ledger_present_cost_unreported";
    } else {
      billing.cost_status = "no_ledger_not_billable";
    }
  } catch (error) {
    billing.readback_error = error.message;
    billing.cost_status = "readback_failed";
  }
  return billing;
}
export async function completion(provider, messages, tools, signal) {
  const key = await providerKey(provider.id);
  const kind = provider.kind || detectKind(provider.baseUrl);
  if (!key && (IMPORT_TARGETS[provider.id] || kind === "iai-one"))
    throw new Error(
      "Chưa có API key cho provider này trong OMCODE Keychain; chưa gửi yêu cầu AI.",
    );
  assertCatalogCurrent(provider, key);
  if (kind === "iai-one")
    return gatewayChat({ ...provider, kind }, key, messages, tools, signal);
  const body = {
    model: provider.model,
    messages,
    stream: false,
    max_tokens: 4096,
    ...(tools.length ? { tools, tool_choice: "auto" } : {}),
  };
  assertEgressAllowed(body);
  const request = {
    method: "POST",
    headers: providerHeaders(provider, key),
    body: JSON.stringify(body),
    signal: AbortSignal.any([signal, AbortSignal.timeout(90000)]),
    redirect: "error",
  };
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(`${provider.baseUrl}/chat/completions`, request);
    if (![502, 503, 504].includes(response.status) || attempt === 2) break;
    await response.body?.cancel();
    const retryAfter = Number(response.headers.get("retry-after"));
    await delay(
      Math.min(5000, retryAfter > 0 ? retryAfter * 1000 : (attempt + 1) * 1000),
      undefined,
      { signal },
    );
  }
  if (!response.ok) {
    const error = new Error(
      `Provider ${provider.name}: HTTP ${response.status}. Kiểm tra model, quyền truy cập và hạn mức trong Kết nối.`,
    );
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  const message = data.choices?.[0]?.message;
  if (!message)
    throw new Error("Provider không trả nội dung hội thoại hợp lệ.");
  return { message, usage: data.usage };
}
export async function probeGeneration(store, id) {
  const providers = store.get("providers", []);
  const provider = providers.find((p) => p.id === id);
  if (!provider) throw new Error("Provider không tồn tại.");
  const start = Date.now();
  try {
    const result = await completion(
      provider,
      [
        {
          role: "user",
          content: "Reply with exactly OMCODE_OK. No other text.",
        },
      ],
      [],
      new AbortController().signal,
    );
    if (result.message.content?.trim() !== "OMCODE_OK")
      throw new Error("AI trả lời nhưng chưa đạt phép kiểm tra.");
    provider.generationStatus = "verified";
    provider.generationError = null;
    provider.generationCheckedAt = Date.now();
    provider.latencyMs = Date.now() - start;
  } catch (error) {
    provider.generationStatus = "failed";
    provider.generationError = error.message;
    provider.generationHttpStatus = error.status;
  }
  store.set("providers", providers);
  return provider;
}
