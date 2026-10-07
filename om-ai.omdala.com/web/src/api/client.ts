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

function blockedResult<T>(): Promise<ApiResult<T>> {
  return Promise.resolve({ error: WEB_SESSION_BRIDGE_ERROR });
}

export function getJson<T>(_path: string): Promise<ApiResult<T>> {
  return blockedResult<T>();
}

export function postJson<T>(
  _path: string,
  _payload: unknown,
): Promise<ApiResult<T>> {
  return blockedResult<T>();
}

export function patchJson<T>(
  _path: string,
  _payload: unknown,
): Promise<ApiResult<T>> {
  return blockedResult<T>();
}
