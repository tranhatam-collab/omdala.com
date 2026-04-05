import { buildApiUrl } from '../config/env';

export type ApiResult<T> = {
  data?: T;
  error?: string;
  requestId?: string;
};

let lastRequestId: string | undefined;

export function getLastRequestId() {
  return lastRequestId;
}

export function subscribeRequestTrace(onRequestId: (requestId?: string) => void) {
  const eventName = 'api-request-trace';
  if (typeof window === 'undefined') {
    return () => {};
  }
  const handler = ((event: Event) => {
    const custom = event as CustomEvent<{ requestId?: string }>;
    onRequestId(custom.detail?.requestId);
  }) as EventListener;
  window.addEventListener(eventName, handler);
  return () => window.removeEventListener(eventName, handler);
}

function extractRequestId(response: Response, body: unknown): string | undefined {
  const fromHeader = response.headers.get('x-request-id') ?? response.headers.get('cf-ray') ?? undefined;
  if (fromHeader) return fromHeader;
  if (body && typeof body === 'object' && 'meta' in (body as Record<string, unknown>)) {
    const meta = (body as { meta?: { requestId?: string; request_id?: string } }).meta;
    return meta?.requestId ?? meta?.request_id;
  }
  return undefined;
}

function pushRequestTrace(requestId?: string) {
  if (!requestId) return;
  lastRequestId = requestId;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api-request-trace', { detail: { requestId } }));
  }
}

export async function getJson<T>(path: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(buildApiUrl(path));
    const body = (await response.json()) as T;
    const requestId = extractRequestId(response, body);
    pushRequestTrace(requestId);
    if (!response.ok) return { error: `http_${response.status}`, requestId };
    return { data: body, requestId };
  } catch {
    return { error: 'network_error' };
  }
}

export async function postJson<T>(
  path: string,
  payload: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(buildApiUrl(path), {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(headers ?? {}) },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as T;
    const requestId = extractRequestId(response, body);
    pushRequestTrace(requestId);
    if (!response.ok) return { error: `http_${response.status}`, requestId };
    return { data: body, requestId };
  } catch {
    return { error: 'network_error' };
  }
}
