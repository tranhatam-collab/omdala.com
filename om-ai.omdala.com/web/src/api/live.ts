import { getJson, patchJson, postJson } from './client';

export type LivePersonaRecord = {
  persona_id: string;
  display_name: string;
  role_type: string;
  category: string;
  primary_languages: string[];
  supports_avatar: boolean;
  supports_voice_only: boolean;
};

export type LivePersonaDetail = LivePersonaRecord & {
  premium_required: boolean;
  safe_for_children: boolean;
  supported_modes: string[];
  curriculum_bindings: string[];
  safety_profile: string;
  supported_providers: string[];
};

export type LiveSessionCreateResult = {
  session_id: string;
  status: string;
  usage: {
    free_seconds_remaining_today: number;
  };
};

export type LiveUsageToday = {
  free_seconds_limit: number;
  free_seconds_used: number;
  free_seconds_remaining: number;
  plan_id: string;
};

export type LiveMemoryProfile = {
  user_id: string;
  display_name?: string;
  timezone: string;
  target_language?: string;
  correction_style?: 'none' | 'gentle' | 'inline' | 'post_turn' | 'end_of_session';
  updated_at: string;
};

export type LivePlanDefinition = {
  plan_id: string;
  display_name: string;
  daily_free_seconds: number;
  supports_avatar: boolean;
  supports_custom_personas: boolean;
};

export type LiveSubscriptionRecord = {
  user_id: string;
  plan_id: string;
  updated_at: string;
};

export type LiveSessionEndResult = {
  session_id: string;
  billable_seconds: number;
  free_seconds_remaining_today: number;
};

export type LiveApiResult<T> = {
  value: T | null;
  error: string | null;
};

function fail<T>(error: string): LiveApiResult<T> {
  return { value: null, error };
}

export async function listLivePersonas(): Promise<LiveApiResult<LivePersonaRecord[]>> {
  const result = await getJson<{ data?: { items?: LivePersonaRecord[] } }>('/v2/live/personas');
  if (result.error) return fail(result.error);
  return { value: result.data?.data?.items ?? [], error: null };
}

export async function getLivePersonaDetail(personaId: string): Promise<LiveApiResult<LivePersonaDetail>> {
  const result = await getJson<{ data?: LivePersonaDetail }>(`/v2/live/personas/${personaId}`);
  if (result.error || !result.data?.data) return fail(result.error ?? 'request_failed');
  return { value: result.data.data, error: null };
}

export async function createLiveSession(payload: {
  user_id: string;
  persona_id: string;
  session_type: string;
  avatar_enabled: boolean;
}): Promise<LiveApiResult<LiveSessionCreateResult>> {
  const result = await postJson<{ data?: LiveSessionCreateResult }>('/v2/live/sessions/create', payload);
  if (result.error || !result.data?.data) return fail(result.error ?? 'request_failed');
  return { value: result.data.data, error: null };
}

export async function connectLiveSession(sessionId: string): Promise<LiveApiResult<{ session_id: string; status: string }>> {
  const result = await postJson<{ data?: { session_id: string; status: string } }>(
    `/v2/live/sessions/${sessionId}/connect`,
    {},
  );
  if (result.error || !result.data?.data) return fail(result.error ?? 'request_failed');
  return { value: result.data.data, error: null };
}

export async function endLiveSession(
  sessionId: string,
  billableSeconds: number,
): Promise<LiveApiResult<LiveSessionEndResult>> {
  const result = await postJson<{ data?: LiveSessionEndResult }>(`/v2/live/sessions/${sessionId}/end`, {
    billable_seconds: billableSeconds,
  });
  if (result.error || !result.data?.data) return fail(result.error ?? 'request_failed');
  return { value: result.data.data, error: null };
}

export async function getLiveUsageToday(userId: string): Promise<LiveApiResult<LiveUsageToday>> {
  const result = await getJson<{ data?: { usage?: LiveUsageToday } }>(`/v2/live/usage/today?user_id=${userId}`);
  if (result.error || !result.data?.data?.usage) return fail(result.error ?? 'request_failed');
  return { value: result.data.data.usage, error: null };
}

export async function getLiveMemoryProfile(userId: string): Promise<LiveApiResult<LiveMemoryProfile>> {
  const result = await getJson<{ data?: { profile?: LiveMemoryProfile } }>(`/v2/live/memory/profile?user_id=${userId}`);
  if (result.error || !result.data?.data?.profile) return fail(result.error ?? 'request_failed');
  return { value: result.data.data.profile, error: null };
}

export async function updateLiveMemoryProfile(payload: {
  user_id: string;
  display_name?: string;
  timezone?: string;
  target_language?: string;
  correction_style?: LiveMemoryProfile['correction_style'];
}): Promise<LiveApiResult<LiveMemoryProfile>> {
  const result = await patchJson<{ data?: { profile?: LiveMemoryProfile } }>('/v2/live/memory/profile', payload);
  if (result.error || !result.data?.data?.profile) return fail(result.error ?? 'request_failed');
  return { value: result.data.data.profile, error: null };
}

export async function listLivePlans(): Promise<LiveApiResult<LivePlanDefinition[]>> {
  const result = await getJson<{ data?: { plans?: LivePlanDefinition[] } }>('/v2/live/plans');
  if (result.error) return fail(result.error);
  return { value: result.data?.data?.plans ?? [], error: null };
}

export async function upgradeLivePlan(payload: {
  user_id: string;
  plan_id: string;
}): Promise<LiveApiResult<LiveSubscriptionRecord>> {
  const result = await postJson<{ data?: { subscription?: LiveSubscriptionRecord } }>('/v2/live/plans/upgrade', payload);
  if (result.error || !result.data?.data?.subscription) return fail(result.error ?? 'request_failed');
  return { value: result.data.data.subscription, error: null };
}
