import fs from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { gatewayCatalog, gatewayInvoke, policy } from "./gateway.mjs";
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
          `OMCODE_TEST_API_KEY_${String(id)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "_")}`
        ];
      if (scoped) return scoped;
      if (process.env.OMCODE_TEST_API_KEY)
        return process.env.OMCODE_TEST_API_KEY;
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
  return key
    ? createHash("sha256").update(String(key)).digest("hex").slice(0, 16)
    : null;
}
export async function saveProvider(store, input) {
  const providers = store.get("providers", []);
  const id = input.id || randomUUID();
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id))
    throw new Error("Provider ID không hợp lệ.");
  const existing = providers.find((p) => p.id === id);
  let baseUrl = validateEndpoint(input.baseUrl);
  const kind = detectKind(baseUrl, input.kind);
  if (new URL(baseUrl).hostname === "api.aiagent.iai.one") {
    if (
      !["/", "/v1", "/v1/ai", "/v1/ai/chat", "/v1/ai/embed"].includes(
        new URL(baseUrl).pathname,
      )
    )
      throw new Error("AIAGENT cần API base URL https://api.aiagent.iai.one.");
    baseUrl = new URL(baseUrl).origin;
  }
  const identityChanged =
    existing &&
    (existing.baseUrl !== baseUrl ||
      existing.kind !== kind ||
      (input.tenantId !== undefined && existing.tenantId !== input.tenantId) ||
      (input.workspaceId !== undefined &&
        existing.workspaceId !== input.workspaceId));
  if (existing && existing.baseUrl !== baseUrl && !input.apiKey)
    throw new Error("Đổi endpoint cần nhập lại khóa riêng cho đích mới.");
  const provider = {
    id,
    name: String(input.name || "Provider").slice(0, 80),
    baseUrl,
    kind,
    model: String(input.model || "").slice(0, 160),
    models: existing?.models || [],
    catalog: identityChanged ? null : existing?.catalog || null,
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
    const previousModel = provider.model;
    const previousCatalog = provider.catalog;
    const key = await providerKey(id);
    if (!key && (IMPORT_TARGETS[id] || provider.kind === "iai-one"))
      throw new Error(
        "Chưa có API key cho provider này trong OMCODE Keychain.",
      );
    const kind = provider.kind || detectKind(provider.baseUrl);
    let models;
    let embedding = [];
    if (kind === "iai-one") {
      const catalog = await gatewayCatalog(provider, key);
      models = catalog.chat;
      embedding = catalog.embedding;
    } else models = await fetchOpenAIModels(provider, key);
    if (!models.length && !embedding.length)
      throw new Error("Provider không trả danh sách model.");
    provider.models = models;
    provider.embeddingModels = embedding;
    provider.model = normalizeModelId(
      provider.baseUrl,
      String(provider.model || ""),
    );
    if (!provider.models.includes(provider.model))
      provider.model = provider.models[0] || "";
    // Catalog is only usable while this exact credential stays in place.
    provider.catalog = {
      models: provider.models,
      embeddingModels: provider.embeddingModels,
      identity: catalogIdentity(provider),
      fingerprint: credentialFingerprint(key),
      revision: provider.credentialRevision || 0,
      checkedAt: Date.now(),
    };
    provider.status = "connected";
    if (
      provider.model !== previousModel ||
      previousCatalog?.fingerprint !== provider.catalog.fingerprint ||
      previousCatalog?.identity !== provider.catalog.identity
    ) {
      provider.generationStatus = "not_checked";
      provider.generationError = null;
      delete provider.generationHttpStatus;
      delete provider.latencyMs;
    }
    provider.error = null;
    provider.checkedAt = Date.now();
  } catch (error) {
    // A failed check invalidates the previous catalog: it can no longer be
    // tied to a verified credential.
    provider.catalog = null;
    provider.models = [];
    provider.embeddingModels = [];
    provider.generationStatus = "not_checked";
    provider.status = "error";
    provider.error =
      error.name === "TimeoutError" ? "Kết nối quá 15 giây." : error.message;
  }
  store.set("providers", providers);
  return provider;
}
function catalogIdentity(provider) {
  return JSON.stringify([
    provider.baseUrl,
    provider.kind || detectKind(provider.baseUrl),
    provider.tenantId || null,
    provider.workspaceId || null,
  ]);
}
function assertCatalogCurrent(provider, key, capability = "chat") {
  const credentialed =
    Boolean(key) || IMPORT_TARGETS[provider.id] || provider.kind === "iai-one";
  if (!credentialed) return;
  const catalog = provider.catalog;
  const revision = provider.credentialRevision || 0;
  if (
    !catalog ||
    catalog.fingerprint !== credentialFingerprint(key) ||
    catalog.revision !== revision ||
    catalog.identity !== catalogIdentity(provider) ||
    !Array.isArray(catalog.models) ||
    !(capability === "embed"
      ? catalog.embeddingModels?.length
      : catalog.models.length)
  )
    throw new Error(
      "Catalog chưa gắn với credential hiện tại. Chạy Kiểm tra trong Kết nối trước khi gửi yêu cầu AI.",
    );
  // Model fallback is only allowed inside the credential-verified catalog.
  if (
    !(
      capability === "embed" ? catalog.embeddingModels || [] : catalog.models
    ).includes(provider.model)
  )
    throw new Error(
      `Model ${provider.model} không nằm trong catalog đã xác minh cho credential này.`,
    );
}
export function prepareCompletion(
  provider,
  messages,
  tools,
  requestId = "req_" + randomUUID(),
) {
  const kind = provider.kind || detectKind(provider.baseUrl);
  const request =
    kind === "iai-one"
      ? {
          destination: validateEndpoint(provider.baseUrl) + "/v1/ai/chat",
          body: {
            model: provider.model,
            messages,
            ...policy("chat"),
            request_id: requestId,
            ...(tools.length ? { tools } : {}),
          },
        }
      : {
          destination: validateEndpoint(provider.baseUrl) + "/chat/completions",
          body: {
            model: provider.model,
            messages,
            stream: false,
            max_tokens: 4096,
            ...(tools.length ? { tools, tool_choice: "auto" } : {}),
          },
        };
  assertEgressAllowed(request.body);
  return request;
}
export async function completion(
  provider,
  messages,
  tools,
  signal = new AbortController().signal,
  approved,
) {
  const key = await providerKey(provider.id);
  const kind = provider.kind || detectKind(provider.baseUrl);
  if (!key && (IMPORT_TARGETS[provider.id] || kind === "iai-one"))
    throw new Error(
      "Chưa có API key cho provider này trong OMCODE Keychain; chưa gửi yêu cầu AI.",
    );
  assertCatalogCurrent(provider, key);
  const request = prepareCompletion(
    provider,
    messages,
    tools,
    approved?.body.request_id,
  );
  if (approved && JSON.stringify(request) !== JSON.stringify(approved))
    throw new Error("Payload/destination thay đổi sau xác nhận.");
  if (kind === "iai-one") return gatewayInvoke(provider, key, request, signal);
  // Never retry an ambiguous generation: upstream may already have billed it.
  const response = await fetch(request.destination, {
    method: "POST",
    headers: providerHeaders(provider, key),
    body: JSON.stringify(request.body),
    signal: AbortSignal.any([signal, AbortSignal.timeout(90000)]),
    redirect: "error",
  });
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
export function prepareEmbedding(
  provider,
  input,
  requestId = "req_" + randomUUID(),
) {
  if (typeof input !== "string" || !input.trim() || input.length > 20000)
    throw new Error("Embedding cần văn bản dưới 20.000 ký tự.");
  const request = {
    destination: validateEndpoint(provider.baseUrl) + "/v1/ai/embed",
    body: {
      model: provider.model,
      input,
      ...policy("embed"),
      request_id: requestId,
    },
  };
  assertEgressAllowed(request.body);
  return request;
}
export async function embedding(
  provider,
  input,
  signal = new AbortController().signal,
  approved,
) {
  const key = await providerKey(provider.id);
  if (!key || (provider.kind || detectKind(provider.baseUrl)) !== "iai-one")
    throw new Error("Embedding cần kết nối AIAGENT đã xác minh.");
  assertCatalogCurrent(provider, key, "embed");
  // The internal contract runner also supports a bounded batch of synthetic inputs.
  const request = Array.isArray(input)
    ? {
        destination: provider.baseUrl + "/v1/ai/embed",
        body: {
          model: provider.model,
          input,
          ...policy("embed"),
          request_id: "req_" + randomUUID(),
        },
      }
    : prepareEmbedding(provider, input, approved?.body.request_id);
  if (approved && JSON.stringify(approved) !== JSON.stringify(request))
    throw new Error("Embedding payload thay đổi sau xác nhận.");
  const data = await gatewayInvoke(provider, key, request, signal);
  if (
    !Array.isArray(data.embeddings) ||
    !data.embeddings.length ||
    data.embeddings.some(
      (e) =>
        !Array.isArray(e) || !e.length || e.some((v) => !Number.isFinite(v)),
    )
  )
    throw new Error("Embedding response không hợp lệ.");
  return data;
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
    delete provider.generationHttpStatus;
    provider.generationCheckedAt = Date.now();
    provider.latencyMs = Date.now() - start;
  } catch (error) {
    provider.generationStatus = "failed";
    delete provider.latencyMs;
    provider.generationCheckedAt = Date.now();
    provider.generationError = error.message;
    provider.generationHttpStatus = error.status;
  }
  store.set("providers", providers);
  return provider;
}
