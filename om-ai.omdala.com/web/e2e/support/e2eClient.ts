// Test-only replacement for src/api/client.ts, swapped in by vite.config.ts for `--mode e2e` only.
// It lives outside src/ on purpose: the mobile contract test forbids any fetch call under web/src.
export type ApiResult<T> = {
  data?: T;
  error?: string;
  requestId?: string;
};

export const WEB_SESSION_BRIDGE_ERROR = 'canonical_session_bridge_unavailable';

export function getLastRequestId() {
  return undefined;
}

export function subscribeRequestTrace(_onRequestId: (requestId?: string) => void) {
  return () => {};
}

async function request<T>(method: string, path: string, payload?: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method,
      headers: { 'content-type': 'application/json', 'x-om-ai-e2e-transport': '1' },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) {
      const code = (body as { error?: { code?: unknown } } | null)?.error?.code;
      return { error: typeof code === 'string' ? code : `http_${response.status}` };
    }
    return { data: body as T };
  } catch {
    return { error: 'network_error' };
  }
}

export function getJson<T>(path: string): Promise<ApiResult<T>> {
  return request<T>('GET', path);
}

export function postJson<T>(path: string, payload: unknown): Promise<ApiResult<T>> {
  return request<T>('POST', path, payload);
}

export function patchJson<T>(path: string, payload: unknown): Promise<ApiResult<T>> {
  return request<T>('PATCH', path, payload);
}
