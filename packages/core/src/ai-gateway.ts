// ─── AI Provider Gateway — Unified interface for all AI providers ───────────
export interface AIProvider {
  id: string;
  name: string;
  type: "openai" | "anthropic" | "google" | "groq" | "deepseek" | "cloudflare" | "local";
  models: AIModel[];
  baseCostPer1kTokens: number;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsFunctions: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: "chat" | "completion" | "embedding";
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  capabilities: ModelCapabilities;
}

export interface ModelCapabilities {
  code: boolean;
  reasoning: boolean;
  vision: boolean;
  tools: boolean;
  jsonMode: boolean;
}

export interface AIRequest {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: "stop" | "length" | "tool_calls";
  toolCalls?: Array<{ name: string; arguments: string }>;
}

export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

// ─── Provider Registry ─────────────────────────────────────────────────────
export const AI_PROVIDERS: Record<string, AIProvider> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    type: "openai",
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        provider: "openai",
        type: "chat",
        contextWindow: 128000,
        costPer1kInput: 0.005,
        costPer1kOutput: 0.015,
        capabilities: { code: true, reasoning: true, vision: true, tools: true, jsonMode: true },
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "openai",
        type: "chat",
        contextWindow: 128000,
        costPer1kInput: 0.00015,
        costPer1kOutput: 0.0006,
        capabilities: { code: true, reasoning: true, vision: true, tools: true, jsonMode: true },
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        provider: "openai",
        type: "chat",
        contextWindow: 128000,
        costPer1kInput: 0.01,
        costPer1kOutput: 0.03,
        capabilities: { code: true, reasoning: true, vision: true, tools: true, jsonMode: true },
      },
      {
        id: "o1-preview",
        name: "o1-preview",
        provider: "openai",
        type: "chat",
        contextWindow: 128000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.06,
        capabilities: { code: true, reasoning: true, vision: false, tools: false, jsonMode: true },
      },
      {
        id: "o1-mini",
        name: "o1-mini",
        provider: "openai",
        type: "chat",
        contextWindow: 128000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.012,
        capabilities: { code: true, reasoning: true, vision: false, tools: false, jsonMode: true },
      },
    ],
    baseCostPer1kTokens: 0.005,
    maxTokens: 4096,
    supportsStreaming: true,
    supportsFunctions: true,
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    type: "anthropic",
    models: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        provider: "anthropic",
        type: "chat",
        contextWindow: 200000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        capabilities: { code: true, reasoning: true, vision: true, tools: true, jsonMode: true },
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        provider: "anthropic",
        type: "chat",
        contextWindow: 200000,
        costPer1kInput: 0.0008,
        costPer1kOutput: 0.004,
        capabilities: { code: true, reasoning: true, vision: true, tools: true, jsonMode: true },
      },
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        provider: "anthropic",
        type: "chat",
        contextWindow: 200000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        capabilities: { code: true, reasoning: true, vision: true, tools: true, jsonMode: true },
      },
    ],
    baseCostPer1kTokens: 0.003,
    maxTokens: 4096,
    supportsStreaming: true,
    supportsFunctions: true,
  },
  google: {
    id: "google",
    name: "Google AI",
    type: "google",
    models: [
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash",
        provider: "google",
        type: "chat",
        contextWindow: 1000000,
        costPer1kInput: 0.000075,
        costPer1kOutput: 0.0003,
        capabilities: { code: true, reasoning: true, vision: true, tools: true, jsonMode: true },
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        provider: "google",
        type: "chat",
        contextWindow: 2000000,
        costPer1kInput: 0.00125,
        costPer1kOutput: 0.005,
        capabilities: { code: true, reasoning: true, vision: true, tools: true, jsonMode: true },
      },
    ],
    baseCostPer1kTokens: 0.00075,
    maxTokens: 8192,
    supportsStreaming: true,
    supportsFunctions: true,
  },
  groq: {
    id: "groq",
    name: "Groq",
    type: "groq",
    models: [
      {
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B",
        provider: "groq",
        type: "chat",
        contextWindow: 131072,
        costPer1kInput: 0.00059,
        costPer1kOutput: 0.00079,
        capabilities: { code: true, reasoning: true, vision: false, tools: true, jsonMode: true },
      },
      {
        id: "mixtral-8x7b-32768",
        name: "Mixtral 8x7B",
        provider: "groq",
        type: "chat",
        contextWindow: 32768,
        costPer1kInput: 0.00024,
        costPer1kOutput: 0.00024,
        capabilities: { code: true, reasoning: true, vision: false, tools: true, jsonMode: true },
      },
    ],
    baseCostPer1kTokens: 0.00024,
    maxTokens: 4096,
    supportsStreaming: true,
    supportsFunctions: true,
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    type: "deepseek",
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek Chat",
        provider: "deepseek",
        type: "chat",
        contextWindow: 128000,
        costPer1kInput: 0.00014,
        costPer1kOutput: 0.00028,
        capabilities: { code: true, reasoning: true, vision: false, tools: true, jsonMode: true },
      },
      {
        id: "deepseek-coder",
        name: "DeepSeek Coder",
        provider: "deepseek",
        type: "chat",
        contextWindow: 128000,
        costPer1kInput: 0.00014,
        costPer1kOutput: 0.00028,
        capabilities: { code: true, reasoning: true, vision: false, tools: true, jsonMode: true },
      },
    ],
    baseCostPer1kTokens: 0.00014,
    maxTokens: 4096,
    supportsStreaming: true,
    supportsFunctions: true,
  },
  cloudflare: {
    id: "cloudflare",
    name: "Cloudflare Workers AI",
    type: "cloudflare",
    models: [
      {
        id: "@cf/meta/llama-3.3-70b-instruct",
        name: "Llama 3.3 70B",
        provider: "cloudflare",
        type: "chat",
        contextWindow: 131072,
        costPer1kInput: 0.0001,
        costPer1kOutput: 0.0001,
        capabilities: { code: true, reasoning: true, vision: false, tools: false, jsonMode: true },
      },
      {
        id: "@cf/meta/llama-2-7b-chat-int8",
        name: "Llama 2 7B",
        provider: "cloudflare",
        type: "chat",
        contextWindow: 4096,
        costPer1kInput: 0.00001,
        costPer1kOutput: 0.00001,
        capabilities: { code: true, reasoning: false, vision: false, tools: false, jsonMode: true },
      },
    ],
    baseCostPer1kTokens: 0.0001,
    maxTokens: 2048,
    supportsStreaming: true,
    supportsFunctions: false,
  },
  local: {
    id: "local",
    name: "Local Models (Ollama/LM Studio)",
    type: "local",
    models: [
      {
        id: "llama3.2",
        name: "Llama 3.2",
        provider: "local",
        type: "chat",
        contextWindow: 131072,
        costPer1kInput: 0,
        costPer1kOutput: 0,
        capabilities: { code: true, reasoning: true, vision: false, tools: false, jsonMode: true },
      },
      {
        id: "codellama",
        name: "Code Llama",
        provider: "local",
        type: "chat",
        contextWindow: 16384,
        costPer1kInput: 0,
        costPer1kOutput: 0,
        capabilities: { code: true, reasoning: true, vision: false, tools: false, jsonMode: true },
      },
    ],
    baseCostPer1kTokens: 0,
    maxTokens: 4096,
    supportsStreaming: true,
    supportsFunctions: false,
  },
};

export function getModelById(modelId: string): AIModel | undefined {
  for (const provider of Object.values(AI_PROVIDERS)) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) return model;
  }
  return undefined;
}

export function getModelsByCapability(capability: keyof ModelCapabilities): AIModel[] {
  const models: AIModel[] = [];
  for (const provider of Object.values(AI_PROVIDERS)) {
    for (const model of provider.models) {
      if (model.capabilities[capability]) {
        models.push(model);
      }
    }
  }
  return models.sort((a, b) => a.costPer1kInput - b.costPer1kInput);
}

export function getCheapestModelForTask(taskType: "code" | "reasoning" | "vision" | "general"): AIModel | undefined {
  const capabilityMap: Record<typeof taskType, keyof ModelCapabilities> = {
    code: "code",
    reasoning: "reasoning",
    vision: "vision",
    general: "reasoning",
  };
  const models = getModelsByCapability(capabilityMap[taskType]);
  return models[0];
}
