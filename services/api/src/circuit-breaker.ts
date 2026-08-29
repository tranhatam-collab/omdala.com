// ─── Circuit Breaker & Retry Logic for External APIs ──────────────────────

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  resetTimeoutMs: number;
}

class CircuitBreaker {
  state: CircuitState = "CLOSED";
  failures = 0;
  successes = 0;
  lastFailureTime: number | null = null;
  private config: CircuitConfig;

  constructor(config: Partial<CircuitConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 3,
      successThreshold: config.successThreshold ?? 2,
      timeoutMs: config.timeoutMs ?? 10000,
      resetTimeoutMs: config.resetTimeoutMs ?? 30000,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs
      ) {
        this.state = "HALF_OPEN";
        this.failures = 0;
        this.successes = 0;
      } else {
        throw new CircuitOpenError("Circuit breaker is OPEN for this provider");
      }
    }

    try {
      const result = await this.raceWithTimeout(fn());
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private raceWithTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Provider timeout after ${this.config.timeoutMs}ms`)),
          this.config.timeoutMs,
        ),
      ),
    ]);
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = "CLOSED";
        this.failures = 0;
        this.successes = 0;
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN" || this.failures >= this.config.failureThreshold) {
      this.state = "OPEN";
    }
  }
}

class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircuitOpenError";
  }
}

export { CircuitBreaker, CircuitOpenError };

// ─── Retry Logic ─────────────────────────────────────────────────────────

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 5000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ["ETIMEDOUT", "ECONNRESET", "EAI_AGAIN", "ENOTFOUND"],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown, config: RetryConfig): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as Record<string, unknown>;
  const status = e.status ?? e.statusCode;
  if (typeof status === "number" && config.retryableStatuses.includes(status)) {
    return true;
  }
  const message = String(e.message ?? "").toUpperCase();
  return config.retryableErrors.some((err) => message.includes(err));
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === cfg.maxAttempts || !isRetryableError(error, cfg)) {
        throw error;
      }
      const delay = Math.min(
        cfg.baseDelayMs * Math.pow(2, attempt - 1),
        cfg.maxDelayMs,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

// ─── Fetch with Circuit Breaker + Retry ─────────────────────────────────

export interface FetchWithResilienceOptions {
  circuitBreaker?: CircuitBreaker;
  retryConfig?: Partial<RetryConfig>;
}

export async function fetchWithResilience(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: FetchWithResilienceOptions,
): Promise<Response> {
  const cb = options?.circuitBreaker;
  const retryCfg = options?.retryConfig ?? {};

  const doFetch = async () => {
    const response = await fetch(input, init);
    if (!response.ok && response.status >= 500) {
      const err = Object.assign(new Error(`HTTP ${response.status}`), {
        status: response.status,
      });
      throw err;
    }
    return response;
  };

  if (cb) {
    return withRetry(() => cb.execute(() => doFetch()), retryCfg);
  }

  return withRetry(() => doFetch(), retryCfg);
}
