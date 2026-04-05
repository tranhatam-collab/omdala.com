import { buildApiUrl } from '../config/env';
import { withAuthHeaders } from './authHeaders';

export type ApiResult<T> = {
  data?: T;
  error?: string;
};

export async function getJson<T>(path: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(buildApiUrl(path), {
      headers: withAuthHeaders(),
    });
    if (!response.ok) return { error: `http_${response.status}` };
    return { data: (await response.json()) as T };
  } catch {
    return { error: 'network_error' };
  }
}

export async function postJson<T>(path: string, payload: unknown, headers?: Record<string, string>): Promise<ApiResult<T>> {
  try {
    const response = await fetch(buildApiUrl(path), {
      method: 'POST',
      headers: withAuthHeaders({ 'content-type': 'application/json', ...(headers ?? {}) }),
      body: JSON.stringify(payload),
    });
    if (!response.ok) return { error: `http_${response.status}` };
    return { data: (await response.json()) as T };
  } catch {
    return { error: 'network_error' };
  }
}
