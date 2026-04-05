import { buildApiUrl } from "../config/env";
import { withAuthHeaders } from "./authHeaders";

export type ApiResult<T> = {
  data?: T;
  error?: string;
  requestId?: string;
};

function generateRequestId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function getJson<T>(path: string): Promise<ApiResult<T>> {
  const requestId = generateRequestId();
  try {
    const response = await fetch(buildApiUrl(path), {
      headers: withAuthHeaders({ "x-request-id": requestId }),
    });
    const responseRequestId = response.headers.get("x-request-id") ?? requestId;
    if (!response.ok)
      return { error: `http_${response.status}`, requestId: responseRequestId };
    return { data: (await response.json()) as T, requestId: responseRequestId };
  } catch {
    return { error: "network_error", requestId };
  }
}

export async function postJson<T>(
  path: string,
  payload: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  const requestId = generateRequestId();
  try {
    const response = await fetch(buildApiUrl(path), {
      method: "POST",
      headers: withAuthHeaders({
        "content-type": "application/json",
        "x-request-id": requestId,
        ...(headers ?? {}),
      }),
      body: JSON.stringify(payload),
    });
    const responseRequestId = response.headers.get("x-request-id") ?? requestId;
    if (!response.ok)
      return { error: `http_${response.status}`, requestId: responseRequestId };
    return { data: (await response.json()) as T, requestId: responseRequestId };
  } catch {
    return { error: "network_error", requestId };
  }
}
