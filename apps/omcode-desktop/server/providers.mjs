import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { execute } from "./local.mjs";

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
async function secret(action, id, value) {
  const binary =
    process.env.OMCODE_KEYCHAIN_PATH || process.env.OMCODE_NATIVE_PATH;
  if (!binary) {
    if (action === "get" && process.env.OMCODE_TEST_API_KEY)
      return process.env.OMCODE_TEST_API_KEY;
    if (action === "get") return "";
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
export async function saveProvider(store, input) {
  const providers = store.get("providers", []);
  const id = input.id || randomUUID();
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id))
    throw new Error("Provider ID không hợp lệ.");
  const existing = providers.find((p) => p.id === id);
  const provider = {
    id,
    name: String(input.name || "Provider").slice(0, 80),
    baseUrl: validateEndpoint(input.baseUrl),
    model: String(input.model || "").slice(0, 160),
    models: existing?.models || [],
    status: "not_checked",
  };
  if (input.apiKey) await secret("set", id, input.apiKey);
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
export async function checkProvider(store, id) {
  const providers = store.get("providers", []);
  const provider = providers.find((p) => p.id === id);
  if (!provider) throw new Error("Không tìm thấy provider.");
  try {
    const key = await providerKey(id);
    if (!key && IMPORT_TARGETS[id])
      throw new Error(
        "Chưa có API key cho provider này trong OMCODE Keychain.",
      );
    const response = await fetch(`${provider.baseUrl}/models`, {
      headers: key ? { Authorization: `Bearer ${key}` } : {},
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    provider.models = (data.data || [])
      .map((m) => m.id)
      .filter((x) => typeof x === "string")
      .map((id) => normalizeModelId(provider.baseUrl, id))
      .slice(0, 200);
    provider.model = normalizeModelId(provider.baseUrl, provider.model);
    if (!provider.models.length)
      throw new Error("Provider không trả danh sách model.");
    if (!provider.models.includes(provider.model))
      provider.model = provider.models[0];
    provider.status = "connected";
    provider.error = null;
    provider.checkedAt = Date.now();
  } catch (error) {
    provider.status = "error";
    provider.error =
      error.name === "TimeoutError" ? "Kết nối quá 15 giây." : error.message;
  }
  store.set("providers", providers);
  return provider;
}
export async function completion(provider, messages, tools, signal) {
  const key = await providerKey(provider.id);
  if (!key && IMPORT_TARGETS[provider.id])
    throw new Error(
      "Chưa có API key cho provider này trong OMCODE Keychain; chưa gửi yêu cầu AI.",
    );
  const request = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      stream: false,
      max_tokens: 4096,
      ...(tools.length ? { tools, tool_choice: "auto" } : {}),
    }),
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
