// ─── Model Router + Fallback System ─────────────────────────────────────
import { AIRequest, AIResponse, getModelById, type AIModel } from "./ai-gateway";
import { TaskClassification } from "./task-classifier";

interface OpenAICompatibleResponse {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string;
      tool_calls?: Array<{
        function?: { name?: string; arguments?: string };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface AnthropicResponse {
  content?: Array<{ text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  stop_reason?: string;
}

interface GoogleResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

interface CloudflareResponse {
  result?: { response?: string };
}

interface LocalModelResponse {
  response?: string;
  eval_count?: number;
}

function normalizeFinishReason(value: unknown): AIResponse["finishReason"] {
  if (value === "length" || value === "MAX_TOKENS") return "length";
  if (value === "tool_calls") return "tool_calls";
  return "stop";
}

export interface RouterConfig {
  maxRetries: number;
  timeoutMs: number;
  enableFallback: boolean;
  costThreshold: number; // USD
  preferLocal: boolean;
}

export interface RouterResult {
  response: AIResponse;
  modelUsed: string;
  attempts: number;
  totalCost: number;
  fallbackUsed: boolean;
  durationMs: number;
}

export class ModelRouter {
  private config: RouterConfig;
  private providerConfigs: Map<string, { apiKey?: string; baseUrl?: string }>;

  constructor(config: Partial<RouterConfig> = {}) {
    this.config = {
      maxRetries: 3,
      timeoutMs: 30000,
      enableFallback: true,
      costThreshold: 1.0,
      preferLocal: false,
      ...config,
    };
    this.providerConfigs = new Map();
  }

  setProviderConfig(providerId: string, config: { apiKey?: string; baseUrl?: string }) {
    this.providerConfigs.set(providerId, config);
  }

  async route(
    request: AIRequest,
    classification: TaskClassification,
  ): Promise<RouterResult> {
    const startTime = Date.now();
    const modelsToTry = this.buildModelChain(classification);
    let lastError: Error | null = null;
    let attempts = 0;
    let totalCost = 0;
    let fallbackUsed = false;

    for (const modelId of modelsToTry) {
      attempts++;
      try {
        const model = getModelById(modelId);
        if (!model) {
          throw new Error(`Model ${modelId} not found`);
        }

        // Check cost threshold
        const estimatedCost = this.estimateCost(request, model);
        if (estimatedCost > this.config.costThreshold) {
          console.warn(`Cost threshold exceeded for ${modelId}: $${estimatedCost.toFixed(4)}`);
          if (attempts === 1) {
            // Ask user for confirmation (would be implemented in UI)
            console.log("Cost exceeds threshold. Confirming with user...");
          }
        }

        const response = await this.executeRequest(request, modelId);
        const actualCost = this.calculateCost(response.usage, model);
        totalCost += actualCost;

        if (attempts > 1) {
          fallbackUsed = true;
        }

        return {
          response,
          modelUsed: modelId,
          attempts,
          totalCost,
          fallbackUsed,
          durationMs: Date.now() - startTime,
        };
      } catch (error: unknown) {
        const routeError = error instanceof Error ? error : new Error(String(error));
        lastError = routeError;
        console.error(`Model ${modelId} failed:`, routeError.message);

        // Check if error is retryable
        if (!this.isRetryableError(routeError)) {
          throw routeError;
        }

        // Continue to next model in chain
        continue;
      }
    }

    // All models failed
    throw new Error(
      `All models failed after ${attempts} attempts. Last error: ${lastError?.message}`,
    );
  }

  private buildModelChain(classification: TaskClassification): string[] {
    const chain: string[] = [];

    // Start with recommended model
    chain.push(classification.recommendedModel);

    // Add fallbacks if enabled
    if (this.config.enableFallback) {
      chain.push(...classification.fallbackModels);
    }

    // Add local model as last resort if preferred
    if (this.config.preferLocal) {
      chain.push("llama3.2", "codellama");
    }

    // Remove duplicates
    return Array.from(new Set(chain));
  }

  private async executeRequest(request: AIRequest, modelId: string): Promise<AIResponse> {
    const model = getModelById(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const providerConfig = this.providerConfigs.get(model.provider);
    if (!providerConfig?.apiKey && model.provider !== "local") {
      throw new Error(`No API key configured for provider ${model.provider}`);
    }

    const config = providerConfig || {};

    // Call actual provider API
    switch (model.provider) {
      case "openai":
        return await this.callOpenAI(request, modelId, config);
      case "anthropic":
        return await this.callAnthropic(request, modelId, config);
      case "google":
        return await this.callGoogle(request, modelId, config);
      case "groq":
        return await this.callGroq(request, modelId, config);
      case "deepseek":
        return await this.callDeepSeek(request, modelId, config);
      case "cloudflare":
        return await this.callCloudflare(request, modelId, config);
      case "local":
        return await this.callLocal(request, modelId, config);
      default:
        throw new Error(`Unsupported provider: ${model.provider}`);
    }
  }

  private createTimeoutSignal(ms: number): AbortSignal {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      return AbortSignal.timeout(ms);
    }
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    // Best-effort cleanup; fetch may keep signal alive
    controller.signal.addEventListener("abort", () => clearTimeout(id), { once: true });
    return controller.signal;
  }

  private async callOpenAI(request: AIRequest, modelId: string, config: { apiKey?: string; baseUrl?: string }): Promise<AIResponse> {
    const baseUrl = config.baseUrl || "https://api.openai.com/v1";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
        stream: false,
      }),
      signal: this.createTimeoutSignal(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as OpenAICompatibleResponse;
    const choice = data?.choices?.[0];
    if (!choice) throw new Error("OpenAI response missing choices");

    return {
      content: choice.message?.content ?? "",
      model: modelId,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: normalizeFinishReason(choice.finish_reason),
      toolCalls: choice.message?.tool_calls?.flatMap((call) => {
        const name = call.function?.name;
        if (!name) return [];
        return [{ name, arguments: call.function?.arguments ?? "{}" }];
      }),
    };
  }

  private async callAnthropic(request: AIRequest, modelId: string, config: { apiKey?: string; baseUrl?: string }): Promise<AIResponse> {
    const baseUrl = config.baseUrl || "https://api.anthropic.com/v1";
    const response = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelId,
        messages: request.messages,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
      }),
      signal: this.createTimeoutSignal(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    const contentBlock = data?.content?.[0];
    if (!contentBlock) throw new Error("Anthropic response missing content");

    return {
      content: contentBlock.text ?? "",
      model: modelId,
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      finishReason: normalizeFinishReason(data.stop_reason),
    };
  }

  private async callGoogle(request: AIRequest, modelId: string, config: { apiKey?: string; baseUrl?: string }): Promise<AIResponse> {
    const baseUrl = config.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
    const response = await fetch(`${baseUrl}/models/${modelId}:generateContent?key=${config.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: request.messages.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 4096,
        },
      }),
      signal: this.createTimeoutSignal(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as GoogleResponse;
    const candidate = data?.candidates?.[0];
    if (!candidate) throw new Error("Google response missing candidates");

    return {
      content: candidate.content?.parts?.[0]?.text ?? "",
      model: modelId,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
      finishReason: normalizeFinishReason(candidate.finishReason),
    };
  }

  private async callGroq(request: AIRequest, modelId: string, config: { apiKey?: string; baseUrl?: string }): Promise<AIResponse> {
    const baseUrl = config.baseUrl || "https://api.groq.com/openai/v1";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
      }),
      signal: this.createTimeoutSignal(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as OpenAICompatibleResponse;
    const choice = data?.choices?.[0];
    if (!choice) throw new Error("Groq response missing choices");

    return {
      content: choice.message?.content ?? "",
      model: modelId,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: normalizeFinishReason(choice.finish_reason),
    };
  }

  private async callDeepSeek(request: AIRequest, modelId: string, config: { apiKey?: string; baseUrl?: string }): Promise<AIResponse> {
    if (!config.apiKey) throw new Error("DeepSeek API key is required");
    const baseUrl = config.baseUrl || "https://api.deepseek.com/v1";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
      }),
      signal: this.createTimeoutSignal(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as OpenAICompatibleResponse;
    const choice = data?.choices?.[0];
    if (!choice) throw new Error("DeepSeek response missing choices");

    return {
      content: choice.message?.content ?? "",
      model: modelId,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: normalizeFinishReason(choice.finish_reason),
    };
  }

  private async callCloudflare(request: AIRequest, modelId: string, config: { apiKey?: string; baseUrl?: string }): Promise<AIResponse> {
    if (!config.apiKey) throw new Error("Cloudflare account ID (apiKey) is required");
    const baseUrl = config.baseUrl || "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run";
    // Cloudflare Workers AI requires account ID in URL
    const accountId = config.apiKey;
    const response = await fetch(`${baseUrl.replace("{account_id}", accountId || "")}/${modelId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        messages: request.messages,
        max_tokens: request.maxTokens ?? 4096,
      }),
      signal: this.createTimeoutSignal(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as CloudflareResponse;

    return {
      content: data?.result?.response ?? "",
      model: modelId,
      usage: {
        promptTokens: 0, // Cloudflare doesn't return token count
        completionTokens: 0,
        totalTokens: 0,
      },
      finishReason: "stop",
    };
  }

  private async callLocal(request: AIRequest, modelId: string, config: { apiKey?: string; baseUrl?: string }): Promise<AIResponse> {
    if (!Array.isArray(request.messages) || request.messages.length === 0) {
      throw new Error("AIRequest.messages must be a non-empty array");
    }
    const safeTemperature = typeof request.temperature === "number" && !isNaN(request.temperature) ? request.temperature : 0.7;
    const safeMaxTokens = typeof request.maxTokens === "number" && request.maxTokens > 0 ? request.maxTokens : 4096;
    const baseUrl = config.baseUrl || "http://localhost:11434/api";
    const response = await fetch(`${baseUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        prompt: request.messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
        stream: false,
        options: {
          temperature: safeTemperature,
          num_predict: safeMaxTokens,
        },
      }),
      signal: this.createTimeoutSignal(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Local API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as LocalModelResponse;

    return {
      content: data?.response ?? "",
      model: modelId,
      usage: {
        promptTokens: data?.eval_count ?? 0,
        completionTokens: 0,
        totalTokens: data?.eval_count ?? 0,
      },
      finishReason: "stop",
    };
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private estimateCost(request: AIRequest, model: AIModel): number {
    const inputTokens = this.estimateTokens(request.messages.join(""));
    const outputTokens = Math.min(request.maxTokens ?? 4096, model.contextWindow);
    const inputCost = (inputTokens / 1000) * model.costPer1kInput;
    const outputCost = (outputTokens / 1000) * model.costPer1kOutput;
    return inputCost + outputCost;
  }

  private calculateCost(usage: AIResponse["usage"], model: AIModel): number {
    const inputCost = (usage.promptTokens / 1000) * model.costPer1kInput;
    const outputCost = (usage.completionTokens / 1000) * model.costPer1kOutput;
    return inputCost + outputCost;
  }

  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /rate limit/i,
      /429/,
      /timeout/i,
      /502/,
      /503/,
      /504/,
      /connection/i,
      /network/i,
    ];
    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }
}

// Singleton instance
export const modelRouter = new ModelRouter();
