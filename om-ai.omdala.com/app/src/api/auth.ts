import { postJson } from './client';
import type { ApiEnvelope, ApiCallResult, SessionTokenPayload } from '../../../shared/api-contracts';

type MagicLinkData = {
  sent: boolean;
  expiresAt?: string;
};

export async function requestMagicLink(email: string, redirectTo = '/dashboard'): Promise<ApiCallResult<MagicLinkData>> {
  const result = await postJson<ApiEnvelope<MagicLinkData>>('/v1/auth/magic-link/request', { email, redirectTo });
  if (result.error || !result.data?.data) {
    return { value: null, error: result.error ?? 'request_failed' };
  }
  return { value: result.data.data, error: null };
}

export async function refreshSession(refreshToken: string): Promise<ApiCallResult<SessionTokenPayload>> {
  const result = await postJson<ApiEnvelope<SessionTokenPayload>>('/v1/auth/refresh', {
    refresh_token: refreshToken,
  });
  if (result.error || !result.data?.data) {
    return { value: null, error: result.error ?? 'request_failed' };
  }
  return { value: result.data.data, error: null };
}

export async function logoutSession(): Promise<ApiCallResult<{ ok: boolean }>> {
  const result = await postJson<ApiEnvelope<{ ok: boolean }>>('/v1/auth/logout', {});
  if (result.error || !result.data?.data) {
    return { value: null, error: result.error ?? 'request_failed' };
  }
  return { value: result.data.data, error: null };
}
