import { postJson } from './client';
import type { ApiCallResult, ApiEnvelope } from '../../shared/api-contracts';

type MagicLinkRequestPayload = {
  email: string;
  redirectTo: string;
};

type MagicLinkRequestData = {
  sent: boolean;
  expiresAt?: string;
};

export async function requestMagicLink(payload: MagicLinkRequestPayload): Promise<ApiCallResult<MagicLinkRequestData>> {
  const result = await postJson<ApiEnvelope<MagicLinkRequestData>>('/v1/auth/magic-link/request', payload);
  if (result.error || !result.data?.data) {
    return { value: null, error: result.error ?? 'request_failed' };
  }
  return { value: result.data.data, error: null };
}
