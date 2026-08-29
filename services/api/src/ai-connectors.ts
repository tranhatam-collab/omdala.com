// ─── AI Auto-Connectors ──────────────────────────────────────────────────
// Supports: OpenAI, Anthropic (Claude), Google (Gemini), Azure OpenAI,
//           Mistral, Groq, Cohere, and custom HTTP endpoints.

import { CircuitBreaker, fetchWithResilience } from "./circuit-breaker";

// ─── Types ───────────────────────────────────────────────────────────────

export type AiProviderId =
  | "openai"
  | "anthropic"
  | "google-gemini"
  | "azure-openai"
  | "mistral"
  | "groq"
  | "cohere"
  | "custom-http";

export interface AiConnectorConfig {
  provider: AiProviderId;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  customHeaders?: Record<string, string>;
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AiCompletionResponse {
  content: string;
  model: string;
  provider: AiProviderId;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  finishReason?: string;
}

export interface AiProviderHealth {
  provider: AiProviderId;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

// ─── Provider Registry & Defaults ────────────────────────────────────────

const PROVIDER_DEFAULTS: Record<
  AiProviderId,
  { baseUrl: string; defaultModel: string }
> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-sonnet-20241022",
  },
  "google-gemini": {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-1.5-pro-latest",
  },
  "azure-openai": {
    baseUrl: "", // must be provided per deployment
    defaultModel: "gpt-4o",
  },
  mistral: {
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-large-latest",
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-70b-versatile",
  },
  cohere: {
    baseUrl: "https://api.cohere.com/v1",
    defaultModel: "command-r-plus",
  },
  "custom-http": {
    baseUrl: "",
    defaultModel: "",
  },
};

// ─── Circuit Breakers (per provider singletons) ──────────────────────────

const circuitBreakers = new Map<AiProviderId, CircuitBreaker>();

export function getCircuitBreaker(provider: AiProviderId): CircuitBreaker {
  if (!circuitBreakers.has(provider)) {
    circuitBreakers.set(
      provider,
      new CircuitBreaker({ timeoutMs: 15000, resetTimeoutMs: 30000 }),
    );
  }
  return circuitBreakers.get(provider)!;
}

export function resetAllCircuitBreakers(): void {
  circuitBreakers.clear();
}

// ─── Request Builders ──────────────────────────────────────────────────

function buildOpenAIRequest(
  config: AiConnectorConfig,
  req: AiCompletionRequest,
): { url: string; init: RequestInit } {
  const base = config.baseUrl ?? PROVIDER_DEFAULTS.openai.baseUrl;
  return {
    url: `${base}/chat/completions`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body: JSON.stringify({
        model: config.model ?? PROVIDER_DEFAULTS.openai.defaultModel,
        messages: req.messages,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
        stream: req.stream ?? false,
      }),
    },
  };
}

function parseOpenAIResponse(json: unknown): AiCompletionResponse {
  const j = json as Record<string, unknown>;
  const choice = recordArray(j.choices)[0];
  const message = isRecord(choice?.message) ? choice.message : undefined;
  const content = String(message?.content ?? "");
  const model = String(j.model ?? "unknown");
  const usage = (j.usage as Record<string, number> | undefined) ?? {};
  return {
    content,
    model,
    provider: "openai",
    usage: {
      inputTokens: usage.prompt_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
    },
    finishReason:
      typeof choice?.finish_reason === "string" ? choice.finish_reason : undefined,
  };
}

function buildAnthropicRequest(
  config: AiConnectorConfig,
  req: AiCompletionRequest,
): { url: string; init: RequestInit } {
  const base = config.baseUrl ?? PROVIDER_DEFAULTS.anthropic.baseUrl;
  const systemMessage = req.messages.find((m) => m.role === "system")?.content ?? "";
  const conversationMessages = req.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  return {
    url: `${base}/messages`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        ...config.customHeaders,
      },
      body: JSON.stringify({
        model: config.model ?? PROVIDER_DEFAULTS.anthropic.defaultModel,
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature,
        ...(systemMessage ? { system: systemMessage } : {}),
        messages: conversationMessages,
      }),
    },
  };
}

function parseAnthropicResponse(json: unknown): AiCompletionResponse {
  const j = json as Record<string, unknown>;
  const contentBlocks = recordArray(j.content);
  const content = contentBlocks
    .filter((b) => b.type === "text")
    .map((b) => String(b.text))
    .join("");
  const model = String(j.model ?? "unknown");
  const usage = (j.usage as Record<string, number> | undefined) ?? {};
  return {
    content,
    model,
    provider: "anthropic",
    usage: {
      inputTokens: usage.input_tokens ?? 0,
      outputTokens: usage.output_tokens ?? 0,
    },
    finishReason: String(j.stop_reason ?? ""),
  };
}

function buildGoogleGeminiRequest(
  config: AiConnectorConfig,
  req: AiCompletionRequest,
): { url: string; init: RequestInit } {
  const base = config.baseUrl ?? PROVIDER_DEFAULTS["google-gemini"].baseUrl;
  const model = config.model ?? PROVIDER_DEFAULTS["google-gemini"].defaultModel;
  const systemText = req.messages.find((m) => m.role === "system")?.content ?? "";
  const contents = req.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

  return {
    url: `${base}/models/${model}:generateContent?key=${config.apiKey}`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.customHeaders,
      },
      body: JSON.stringify({
        contents,
        ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
        generationConfig: {
          maxOutputTokens: req.maxTokens,
          temperature: req.temperature,
        },
      }),
    },
  };
}

function parseGoogleGeminiResponse(json: unknown): AiCompletionResponse {
  const j = json as Record<string, unknown>;
  const candidates = recordArray(j.candidates);
  const first = candidates[0];
  const candidateContent = isRecord(first?.content) ? first.content : undefined;
  const parts = recordArray(candidateContent?.parts);
  const content = parts.map((p) => String(p.text ?? "")).join("");
  const model = String(j.modelVersion ?? "gemini-unknown");
  const usageMeta = (j.usageMetadata as Record<string, number> | undefined) ?? {};
  return {
    content,
    model,
    provider: "google-gemini",
    usage: {
      inputTokens: usageMeta.promptTokenCount ?? 0,
      outputTokens: usageMeta.candidatesTokenCount ?? 0,
    },
    finishReason:
      typeof first?.finishReason === "string" ? first.finishReason : undefined,
  };
}

function buildMistralRequest(
  config: AiConnectorConfig,
  req: AiCompletionRequest,
): { url: string; init: RequestInit } {
  const base = config.baseUrl ?? PROVIDER_DEFAULTS.mistral.baseUrl;
  return {
    url: `${base}/chat/completions`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body: JSON.stringify({
        model: config.model ?? PROVIDER_DEFAULTS.mistral.defaultModel,
        messages: req.messages,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
      }),
    },
  };
}

function parseMistralResponse(json: unknown): AiCompletionResponse {
  const j = json as Record<string, unknown>;
  const choice = recordArray(j.choices)[0];
  const message = isRecord(choice?.message) ? choice.message : undefined;
  const content = String(message?.content ?? "");
  const model = String(j.model ?? "unknown");
  const usage = (j.usage as Record<string, number> | undefined) ?? {};
  return {
    content,
    model,
    provider: "mistral",
    usage: {
      inputTokens: usage.prompt_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
    },
    finishReason:
      typeof choice?.finish_reason === "string" ? choice.finish_reason : undefined,
  };
}

function buildGroqRequest(
  config: AiConnectorConfig,
  req: AiCompletionRequest,
): { url: string; init: RequestInit } {
  const base = config.baseUrl ?? PROVIDER_DEFAULTS.groq.baseUrl;
  return {
    url: `${base}/chat/completions`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body: JSON.stringify({
        model: config.model ?? PROVIDER_DEFAULTS.groq.defaultModel,
        messages: req.messages,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
      }),
    },
  };
}

function parseGroqResponse(json: unknown): AiCompletionResponse {
  const j = json as Record<string, unknown>;
  const choice = recordArray(j.choices)[0];
  const message = isRecord(choice?.message) ? choice.message : undefined;
  const content = String(message?.content ?? "");
  const model = String(j.model ?? "unknown");
  const usage = (j.usage as Record<string, number> | undefined) ?? {};
  return {
    content,
    model,
    provider: "groq",
    usage: {
      inputTokens: usage.prompt_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
    },
    finishReason:
      typeof choice?.finish_reason === "string" ? choice.finish_reason : undefined,
  };
}

function buildCohereRequest(
  config: AiConnectorConfig,
  req: AiCompletionRequest,
): { url: string; init: RequestInit } {
  const base = config.baseUrl ?? PROVIDER_DEFAULTS.cohere.baseUrl;
  const systemText = req.messages.find((m) => m.role === "system")?.content ?? "";
  const chatHistory = req.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "user" ? "USER" : "CHATBOT",
      message: m.content,
    }));

  return {
    url: `${base}/chat`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body: JSON.stringify({
        model: config.model ?? PROVIDER_DEFAULTS.cohere.defaultModel,
        message: chatHistory[chatHistory.length - 1]?.message ?? "",
        chat_history: chatHistory.slice(0, -1),
        preamble: systemText || undefined,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
      }),
    },
  };
}

function parseCohereResponse(json: unknown): AiCompletionResponse {
  const j = json as Record<string, unknown>;
  const content = String(j.text ?? "");
  const model = String(j.model ?? "unknown");
  const meta = (j.meta as Record<string, unknown> | undefined) ?? {};
  const tokens = (meta.tokens as Record<string, number> | undefined) ?? {};
  return {
    content,
    model,
    provider: "cohere",
    usage: {
      inputTokens: tokens.input_tokens ?? 0,
      outputTokens: tokens.output_tokens ?? 0,
    },
    finishReason: String(j.finish_reason ?? ""),
  };
}

function buildAzureOpenAIRequest(
  config: AiConnectorConfig,
  req: AiCompletionRequest,
): { url: string; init: RequestInit } {
  const base = config.baseUrl ?? PROVIDER_DEFAULTS["azure-openai"].baseUrl;
  const model = config.model ?? PROVIDER_DEFAULTS["azure-openai"].defaultModel;
  const apiVersion = config.customHeaders?.["api-version"] ?? "2024-06-01";
  return {
    url: `${base}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
        ...config.customHeaders,
      },
      body: JSON.stringify({
        messages: req.messages,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
      }),
    },
  };
}

function parseAzureOpenAIResponse(json: unknown): AiCompletionResponse {
  return parseOpenAIResponse(json); // same shape
}

function buildCustomHttpRequest(
  config: AiConnectorConfig,
  req: AiCompletionRequest,
): { url: string; init: RequestInit } {
  const base = config.baseUrl ?? "";
  return {
    url: `${base}/chat/completions`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.customHeaders,
      },
      body: JSON.stringify({
        model: config.model ?? "default",
        messages: req.messages,
        max_tokens: req.maxTokens,
        temperature: req.temperature,
      }),
    },
  };
}

function parseCustomHttpResponse(json: unknown): AiCompletionResponse {
  return parseOpenAIResponse(json); // assume OpenAI-compatible
}

// ─── Unified AI Connector ──────────────────────────────────────────────

export async function aiComplete(
  config: AiConnectorConfig,
  req: AiCompletionRequest,
): Promise<AiCompletionResponse> {
  const builder = REQUEST_BUILDERS[config.provider];
  const parser = RESPONSE_PARSERS[config.provider];
  if (!builder) {
    throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  const { url, init } = builder(config, req);
  const cb = getCircuitBreaker(config.provider);

  const response = await fetchWithResilience(url, init, {
    circuitBreaker: cb,
    retryConfig: { maxAttempts: 3, baseDelayMs: 300 },
  });

  const json = await response.json();
  return parser(json);
}

const REQUEST_BUILDERS: Record<
  AiProviderId,
  (config: AiConnectorConfig, req: AiCompletionRequest) => { url: string; init: RequestInit }
> = {
  openai: buildOpenAIRequest,
  anthropic: buildAnthropicRequest,
  "google-gemini": buildGoogleGeminiRequest,
  "azure-openai": buildAzureOpenAIRequest,
  mistral: buildMistralRequest,
  groq: buildGroqRequest,
  cohere: buildCohereRequest,
  "custom-http": buildCustomHttpRequest,
};

const RESPONSE_PARSERS: Record<
  AiProviderId,
  (json: unknown) => AiCompletionResponse
> = {
  openai: parseOpenAIResponse,
  anthropic: parseAnthropicResponse,
  "google-gemini": parseGoogleGeminiResponse,
  "azure-openai": parseAzureOpenAIResponse,
  mistral: parseMistralResponse,
  groq: parseGroqResponse,
  cohere: parseCohereResponse,
  "custom-http": parseCustomHttpResponse,
};

// ─── Health Check ────────────────────────────────────────────────────────

export async function checkAiProviderHealth(
  config: AiConnectorConfig,
): Promise<AiProviderHealth> {
  const start = Date.now();
  try {
    await aiComplete(config, {
      messages: [{ role: "user", content: "hi" }],
      maxTokens: 1,
    });
    return {
      provider: config.provider,
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      provider: config.provider,
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ─── Auto-Discovery from Environment ───────────────────────────────────

export interface AiEnvConfig {
  openaiKey?: string;
  anthropicKey?: string;
  geminiKey?: string;
  azureKey?: string;
  azureEndpoint?: string;
  mistralKey?: string;
  groqKey?: string;
  cohereKey?: string;
  customEndpoint?: string;
  customKey?: string;
}

export function discoverConnectors(env: AiEnvConfig): AiConnectorConfig[] {
  const configs: AiConnectorConfig[] = [];
  if (env.openaiKey) {
    configs.push({ provider: "openai", apiKey: env.openaiKey });
  }
  if (env.anthropicKey) {
    configs.push({ provider: "anthropic", apiKey: env.anthropicKey });
  }
  if (env.geminiKey) {
    configs.push({ provider: "google-gemini", apiKey: env.geminiKey });
  }
  if (env.azureKey && env.azureEndpoint) {
    configs.push({
      provider: "azure-openai",
      apiKey: env.azureKey,
      baseUrl: env.azureEndpoint,
    });
  }
  if (env.mistralKey) {
    configs.push({ provider: "mistral", apiKey: env.mistralKey });
  }
  if (env.groqKey) {
    configs.push({ provider: "groq", apiKey: env.groqKey });
  }
  if (env.cohereKey) {
    configs.push({ provider: "cohere", apiKey: env.cohereKey });
  }
  if (env.customKey && env.customEndpoint) {
    configs.push({
      provider: "custom-http",
      apiKey: env.customKey,
      baseUrl: env.customEndpoint,
    });
  }
  return configs;
}

// ─── Fallback Chain ──────────────────────────────────────────────────────

export async function aiCompleteWithFallback(
  configs: AiConnectorConfig[],
  req: AiCompletionRequest,
): Promise<AiCompletionResponse> {
  const errors: { provider: AiProviderId; error: string }[] = [];

  for (const config of configs) {
    try {
      return await aiComplete(config, req);
    } catch (err) {
      errors.push({
        provider: config.provider,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  throw new Error(
    `All AI providers failed. Attempts: ${errors.map((e) => `${e.provider}: ${e.error}`).join("; ")}`,
  );
}
