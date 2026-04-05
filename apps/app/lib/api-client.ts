import { OMDALA_API_ORIGIN } from "@omdala/core";

declare const process:
  | {
      env?: {
        NEXT_PUBLIC_API_URL?: string;
      };
    }
  | undefined;

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
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
  const runtimeApiUrl = process?.env?.NEXT_PUBLIC_API_URL;
  return (runtimeApiUrl ?? OMDALA_API_ORIGIN).replace(/\/+$/g, "");
}

function toApiError(
  payload: ApiEnvelope | null,
  status: number,
  fallbackMessage: string,
) {
  const code = payload?.error?.code ?? "API_REQUEST_FAILED";
  const message = payload?.error?.message ?? fallbackMessage;
  return new ApiClientError(message, code, status);
}

export async function apiJsonRequest<T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, init);

  let payload: ApiEnvelope | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw toApiError(payload, response.status, fallbackMessage);
  }

  if (!payload?.ok) {
    throw toApiError(payload, response.status, fallbackMessage);
  }

  return payload.data as T;
}
