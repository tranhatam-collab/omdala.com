// ─── Model Router + Fallback System ─────────────────────────────────────
import { AIRequest, AIResponse, getModelById, type AIModel } from "./ai-gateway";
import { TaskClassification } from "./task-classifier";

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
      } catch (error: any) {
        lastError = error;
        console.error(`Model ${modelId} failed:`, error.message);

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
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
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      model: modelId,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason: choice.finish_reason,
      toolCalls: choice.message.tool_calls,
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
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      model: modelId,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      finishReason: data.stop_reason,
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
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const candidate = data.candidates[0];

    return {
      content: candidate.content.parts[0].text,
      model: modelId,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
      finishReason: candidate.finishReason,
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
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      model: modelId,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason: choice.finish_reason,
    };
  }

  private async callDeepSeek(request: AIRequest, modelId: string, config: { apiKey?: string; baseUrl?: string }): Promise<AIResponse> {
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
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content,
      model: modelId,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason: choice.finish_reason,
    };
  }

  private async callCloudflare(request: AIRequest, modelId: string, config: { apiKey?: string; baseUrl?: string }): Promise<AIResponse> {
    const baseUrl = config.baseUrl || "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run";
    // Cloudflare Workers AI requires account ID in URL
    const accountId = config.apiKey; // Reuse apiKey field for account ID
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
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloudflare API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.result?.response || "",
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
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 4096,
        },
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Local API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.response,
      model: modelId,
      usage: {
        promptTokens: data.eval_count ?? 0,
        completionTokens: 0,
        totalTokens: data.eval_count ?? 0,
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
