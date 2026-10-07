export type ApiResult<T> = {
  data?: T;
  error?: string;
  requestId?: string;
};

export const NATIVE_SESSION_BRIDGE_ERROR = "canonical_session_bridge_unavailable";

function generateRequestId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function getJson<T>(_path: string): Promise<ApiResult<T>> {
  const requestId = generateRequestId();
  return { error: NATIVE_SESSION_BRIDGE_ERROR, requestId };
}

export async function postJson<T>(
  _path: string,
  _payload: unknown,
): Promise<ApiResult<T>> {
  const requestId = generateRequestId();
  return { error: NATIVE_SESSION_BRIDGE_ERROR, requestId };
}
