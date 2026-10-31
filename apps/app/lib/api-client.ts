import { resolvePublicOrigin } from "@omdala/core";

// Read as `process.env.NEXT_PUBLIC_*` (never `process?.env?.…`): the bundler only inlines the
// direct form, and an optional-chained read is undefined in the browser, which silently
// selects the production API origin.
declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
    NEXT_PUBLIC_RELEASE_ENVIRONMENT?: string;
  };
};

export class ApiClientError extends Error {
  code: string;
  status: number;
  /** Seconds from a readable Retry-After header (cross-origin, so only when the API exposes it). */
  retryAfterSeconds: number | null;

  constructor(message: string, code: string, status: number, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type ApiEnvelope = {
  ok?: boolean;
  data?: unknown;
  error?: {
    code?: string;
    message?: string;
  };
};

export function getApiBaseUrl() {
  const runtimeApiUrl = process.env.NEXT_PUBLIC_API_URL;
  return resolvePublicOrigin(
    "api",
    runtimeApiUrl,
    process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT,
  );
}

function parseRetryAfter(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value.trim())) return null;
  return Number(value.trim());
}

function toApiError(
  payload: ApiEnvelope | null,
  status: number,
  fallbackMessage: string,
  retryAfter: string | null = null,
) {
  const code = payload?.error?.code ?? "API_REQUEST_FAILED";
  const message = payload?.error?.message ?? fallbackMessage;
  return new ApiClientError(message, code, status, parseRetryAfter(retryAfter));
}

export async function apiJsonRequest<T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
    ...init,
  });

  let payload: ApiEnvelope | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw toApiError(payload, response.status, fallbackMessage, response.headers.get("Retry-After"));
  }

  if (!payload?.ok) {
    throw toApiError(payload, response.status, fallbackMessage);
  }

  return payload.data as T;
}

export async function hasValidServerSession() {
  if (typeof window === "undefined") return false;

  try {
    const session = await apiJsonRequest<{ expiresAt?: string }>(
      "/v1/auth/session",
      { method: "GET", cache: "no-store" },
      "Unable to verify the authenticated session.",
    );
    if (!session.expiresAt) return false;
    return new Date(session.expiresAt).getTime() > Date.now();
  } catch {
    return false;
  }
}

const UNAVAILABLE_STATUSES = new Set([502, 503, 504]);
const UNAVAILABLE_CODES = new Set(["DATABASE_UNAVAILABLE", "SERVICE_UNAVAILABLE", "UPSTREAM_TIMEOUT"]);

/** True when the API says a dependency is down or timed out (502/503/504 or a known code). */
export function isServiceUnavailableError(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) return false;
  return UNAVAILABLE_STATUSES.has(error.status) || UNAVAILABLE_CODES.has(error.code);
}
