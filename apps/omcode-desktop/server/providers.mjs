import { randomUUID, createHash } from "node:crypto";
import { gatewayCatalog, gatewayInvoke, policy } from "./gateway.mjs";
import { execute } from "./local.mjs";
import { assertEgressAllowed } from "./egress-policy.mjs";
import {
  AIAGENT_DEPLOYMENTS,
  AIAGENT_HOSTS,
  AIAGENT_NAMESPACE,
  aiagentDeploymentForOrigin,
  isAiagentHost,
  isLocalHost,
  validateEndpoint,
  validateUrl,
} from "./endpoint-policy.mjs";

// AIAGENT is the only remote AI provider OMCODE may talk to (Founder rule:
// "API của Aiagent.iai.one không lấy nguồn khác"). The host allowlist lives in
// endpoint-policy.mjs and is applied on user input (saveProvider) AND on every
// credentialed path over persisted records (assertProviderAllowed), so a
// third-party entry created by an older build fails closed before the
// Keychain is read or a request is built.
export {
  AIAGENT_DEPLOYMENTS,
  AIAGENT_HOSTS,
  AIAGENT_NAMESPACE,
  isAiagentHost,
  validateEndpoint,
  validateUrl,
};
// No third-party import targets remain. The credential-import machinery
// (OpenClaw auth-profiles reader, POST /api/import/providers, Settings button)
// was removed with it; the frozen empty object stays for API compatibility.
export const IMPORT_TARGETS = Object.freeze({});
// Kept for API compatibility: model ids are used exactly as the catalog returns them.
export function normalizeModelId(_baseUrl, id) {
  return id;
}
function detectKind(baseUrl, kind) {
  try {
    // The remote endpoint is authoritative. A persisted `kind: openai` must
    // never downgrade an AIAGENT connection into the generic compatibility
    // path, which would bypass the gateway envelope and billing read-back.
    if (isAiagentHost(new URL(baseUrl).hostname)) return "iai-one";
  } catch {
    return "openai";
  }
  return kind === "iai-one" ? "iai-one" : "openai";
}
function isGateway(provider) {
  return detectKind(provider.baseUrl, provider.kind) === "iai-one";
}
export function assertProviderAllowed(provider) {
  const baseUrl = validateEndpoint(provider.baseUrl);
  const url = new URL(baseUrl);
  if (isLocalHost(url.hostname)) {
    if (!["openai", "local", "iai-one"].includes(provider.kind || "openai"))
      throw new Error("Model loopback dùng loại provider local hợp lệ.");
    if (provider.kind === "iai-one")
      for (const field of ["tenantId", "workspaceId"])
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(provider[field] || ""))
          throw new Error("AIAGENT loopback cần identity fixture hợp lệ.");
    return;
  }

  const deployment = aiagentDeploymentForOrigin(baseUrl);
  if (
    !deployment ||
    baseUrl !== deployment.origin ||
    provider.id !== deployment.id ||
    provider.kind !== "iai-one" ||
    provider.tenantId !== deployment.tenantId ||
    provider.workspaceId !== deployment.workspaceId
  )
    throw new Error(
      "Kết nối AIAGENT không khớp tài khoản, môi trường hoặc loại provider đã xác minh.",
    );
}
// Bootstrap sweep: persisted providers that no longer pass the endpoint
// policy are marked as errors with the reason, so the UI cannot show a stale
// "connected" state for a forbidden destination. No network, no Keychain.
export function auditStoredProviders(store) {
  const providers = store.get("providers", []);
  let changed = false;
  for (const provider of providers) {
    try {
      assertProviderAllowed(provider);
    } catch (error) {
      if (
        provider.status !== "error" ||
        provider.error !== error.message ||
        provider.catalog !== null ||
        provider.models?.length ||
        provider.embeddingModels?.length ||
        provider.generationStatus !== "not_checked"
      )
        changed = true;
      provider.status = "error";
      provider.error = error.message;
      provider.catalog = null;
      provider.models = [];
      provider.embeddingModels = [];
      provider.generationStatus = "not_checked";
    }
  }
  if (changed) store.set("providers", providers);
  return providers;
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
    throw new Error(
      "Credential phải được cấp qua luồng native Keychain; API trình duyệt không nhận khóa.",
    );
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
  for (const field of [
    "apiKey",
    "api_key",
    "credential",
    "authorization",
    "token",
    "secret",
  ])
    if (Object.hasOwn(input, field))
      throw new Error(
        "API trình duyệt không nhận credential; hãy dùng luồng native Keychain được cấp quyền.",
      );
  const providers = store.get("providers", []);
  const id = input.id || randomUUID();
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id))
    throw new Error("Provider ID không hợp lệ.");
  const existing = providers.find((p) => p.id === id);
  let baseUrl = validateEndpoint(input.baseUrl);
  const hostname = new URL(baseUrl).hostname;
  const deployment = aiagentDeploymentForOrigin(baseUrl);
  if (
    isAiagentHost(hostname) &&
    input.kind !== undefined &&
    input.kind !== "iai-one"
  )
    throw new Error(
      "Kết nối AIAGENT phải dùng loại provider iai-one; không được hạ xuống chế độ tương thích OpenAI.",
    );
  const kind = detectKind(baseUrl, input.kind);
  if (isAiagentHost(hostname)) {
    if (
      !["/", "/v1", "/v1/ai", "/v1/ai/chat", "/v1/ai/embed"].includes(
        new URL(baseUrl).pathname,
      )
    )
      throw new Error(
        "AIAGENT cần API base URL gốc (https://api.aiagent.iai.one hoặc https://staging-api.aiagent.iai.one).",
      );
    baseUrl = new URL(baseUrl).origin;
    if (!deployment || id !== deployment.id)
      throw new Error(
        "Endpoint AIAGENT phải dùng đúng tài khoản Keychain theo môi trường.",
      );
    for (const [field, expected] of [
      ["tenantId", deployment.tenantId],
      ["workspaceId", deployment.workspaceId],
    ])
      if (input[field] !== undefined && input[field] !== expected)
        throw new Error(
          "Tenant/workspace AIAGENT do deployment và credential xác định; trình duyệt không được chọn authority.",
        );
  }
  // These IDs are macOS Keychain accounts, not interchangeable display names.
  // A staging credential must never be attached to the production destination.
  if (id === "aiagent" || id === "aiagent-staging") {
    const expected =
      id === "aiagent-staging"
        ? "https://staging-api.aiagent.iai.one"
        : "https://api.aiagent.iai.one";
    if (baseUrl !== expected || kind !== "iai-one")
      throw new Error(
        "Tài khoản AIAGENT phải khớp môi trường và endpoint trong biên bản cấp khóa.",
      );
  }
  const identityChanged =
    existing &&
    (existing.baseUrl !== baseUrl ||
      existing.kind !== kind ||
      existing.tenantId !== (deployment?.tenantId ?? input.tenantId) ||
      existing.workspaceId !== (deployment?.workspaceId ?? input.workspaceId));
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
    tenantId: deployment
      ? deployment.tenantId
      : /^[a-zA-Z0-9_-]{1,80}$/.test(input.tenantId || "")
        ? input.tenantId
        : existing?.tenantId || null,
    workspaceId: deployment
      ? deployment.workspaceId
      : /^[a-zA-Z0-9_-]{1,80}$/.test(input.workspaceId || "")
        ? input.workspaceId
        : existing?.workspaceId || null,
    status: "not_checked",
  };
  assertProviderAllowed(provider);
  const next = providers.filter((p) => p.id !== id).concat(provider);
  store.set("providers", next);
  return provider;
}
export async function providerKey(id) {
  return secret("get", id);
}
function providerHeaders(provider, key, extra = {}) {
  return {
    "Content-Type": "application/json",
    ...(key ? { Authorization: `Bearer ${key}` } : {}),
    ...extra,
  };
}
async function fetchOpenAIModels(provider, key) {
  assertProviderAllowed(provider);
  if (!isLocalHost(new URL(validateEndpoint(provider.baseUrl)).hostname))
    throw new Error(
      "Catalog tương thích OpenAI chỉ được phép với model loopback local.",
    );
  const response = await fetch(`${validateEndpoint(provider.baseUrl)}/models`, {
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
    // Persisted endpoint is re-validated before the Keychain is read.
    assertProviderAllowed(provider);
    const key = await providerKey(id);
    if (!key && isGateway(provider))
      throw new Error(
        "Chưa có API key cho provider này trong OMCODE Keychain.",
      );
    const kind = detectKind(provider.baseUrl, provider.kind);
    let models;
    let embedding = [];
    let gatewayIdentity = null;
    if (kind === "iai-one") {
      const catalog = await gatewayCatalog(provider, key);
      models = catalog.chat;
      embedding = catalog.embedding;
      gatewayIdentity = {
        origin: catalog.origin,
        namespace: catalog.namespace,
      };
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
      ...gatewayIdentity,
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
    detectKind(provider.baseUrl, provider.kind),
    provider.tenantId || null,
    provider.workspaceId || null,
  ]);
}
function assertCatalogCurrent(provider, key, capability = "chat") {
  const credentialed = Boolean(key) || isGateway(provider);
  if (!credentialed) return;
  const catalog = provider.catalog;
  const revision = provider.credentialRevision || 0;
  const expectedOrigin = new URL(validateEndpoint(provider.baseUrl)).origin;
  const gateway = isGateway(provider);
  if (
    !catalog ||
    catalog.fingerprint !== credentialFingerprint(key) ||
    catalog.revision !== revision ||
    catalog.identity !== catalogIdentity(provider) ||
    (gateway &&
      (catalog.origin !== expectedOrigin ||
        catalog.namespace !== AIAGENT_NAMESPACE)) ||
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
  assertProviderAllowed(provider);
  const kind = detectKind(provider.baseUrl, provider.kind);
  const endpoint = validateEndpoint(provider.baseUrl);
  if (kind !== "iai-one" && !isLocalHost(new URL(endpoint).hostname))
    throw new Error(
      "Đường dẫn chat tương thích chỉ được phép với model loopback local.",
    );
  const request =
    kind === "iai-one"
      ? {
          destination: endpoint + "/v1/ai/chat",
          body: {
            model: provider.model,
            messages,
            ...policy("chat"),
            request_id: requestId,
            ...(tools.length ? { tools } : {}),
          },
        }
      : {
          destination: endpoint + "/chat/completions",
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
  assertProviderAllowed(provider);
  const key = await providerKey(provider.id);
  const kind = detectKind(provider.baseUrl, provider.kind);
  if (!key && kind === "iai-one")
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
  assertProviderAllowed(provider);
  if (!isGateway(provider))
    throw new Error("Embedding cần kết nối AIAGENT đã xác minh.");
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
  assertProviderAllowed(provider);
  const key = await providerKey(provider.id);
  if (!key || !isGateway(provider))
    throw new Error("Embedding cần kết nối AIAGENT đã xác minh.");
  assertCatalogCurrent(provider, key, "embed");
  // The internal contract runner also supports a bounded batch of synthetic inputs.
  const request = Array.isArray(input)
    ? {
        destination: validateEndpoint(provider.baseUrl) + "/v1/ai/embed",
        body: {
          model: provider.model,
          input,
          ...policy("embed"),
          request_id: "req_" + randomUUID(),
        },
      }
    : prepareEmbedding(provider, input, approved?.body.request_id);
  if (Array.isArray(input)) assertEgressAllowed(request.body);
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
