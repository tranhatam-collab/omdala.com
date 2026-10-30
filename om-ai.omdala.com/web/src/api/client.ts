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

// Test-only transport, compiled in only for `vite --mode e2e`. Production and preview builds keep
// the fail-closed stub below until a canonical session bridge exists; a test asserts this.
const E2E_TRANSPORT = import.meta.env.MODE === 'e2e';

async function e2eRequest<T>(method: string, path: string, payload?: unknown): Promise<ApiResult<T>> {
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

function blockedResult<T>(): Promise<ApiResult<T>> {
  return Promise.resolve({ error: WEB_SESSION_BRIDGE_ERROR });
}

export function getJson<T>(path: string): Promise<ApiResult<T>> {
  if (E2E_TRANSPORT) return e2eRequest<T>('GET', path);
  return blockedResult<T>();
}

export function postJson<T>(
  path: string,
  payload: unknown,
): Promise<ApiResult<T>> {
  if (E2E_TRANSPORT) return e2eRequest<T>('POST', path, payload);
  return blockedResult<T>();
}

export function patchJson<T>(
  path: string,
  payload: unknown,
): Promise<ApiResult<T>> {
  if (E2E_TRANSPORT) return e2eRequest<T>('PATCH', path, payload);
  return blockedResult<T>();
}
