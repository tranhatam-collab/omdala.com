export type LivePlanId =
  | 'free'
  | 'personal_pro'
  | 'education_plus'
  | 'business'
  | 'enterprise_custom';

export type LivePersonaRole =
  | 'english_teacher'
  | 'language_partner'
  | 'gentle_listener'
  | 'communication_coach'
  | 'lecturer';

export type LiveSessionStatus = 'ready' | 'active' | 'ended' | 'failed';

export type LiveProviderId = 'openai_realtime' | 'tavus' | 'heygen' | 'voice_only';

export type LiveProviderRoutingDecision = {
  primary: LiveProviderId;
  fallback: LiveProviderId[];
  reason: string;
};

export type LivePersona = {
  persona_id: string;
  display_name: string;
  role_type: LivePersonaRole;
  category: string;
  primary_languages: string[];
  supports_avatar: boolean;
  supports_voice_only: boolean;
  premium_required: boolean;
  safe_for_children: boolean;
};

export type CreateLiveSessionInput = {
  user_id: string;
  persona_id: string;
  session_type: string;
  avatar_enabled?: boolean;
  goal?: string;
  plan_context?: LivePlanId;
  language_mode?: {
    native_language?: string;
    target_language?: string;
    correction_language?: string;
  };
};

export type LiveSession = {
  session_id: string;
  user_id: string;
  persona_id: string;
  session_type: string;
  status: LiveSessionStatus;
  created_at: string;
  connected_at?: string;
  ended_at?: string;
  avatar_enabled: boolean;
  goal?: string;
  plan_context: LivePlanId;
  language_mode?: {
    native_language?: string;
    target_language?: string;
    correction_language?: string;
  };
  billable_seconds: number;
  free_seconds_applied: number;
  premium_seconds_applied: number;
  provider_routing: LiveProviderRoutingDecision;
};

export type LiveMemoryProfile = {
  user_id: string;
  display_name?: string;
  timezone: string;
  target_language?: string;
  correction_style?: 'none' | 'gentle' | 'inline' | 'post_turn' | 'end_of_session';
  updated_at: string;
};

export type LiveUsageDaily = {
  user_id: string;
  date_key: string;
  free_seconds_limit: number;
  free_seconds_used: number;
  premium_seconds_used: number;
  updated_at: string;
};

export type LiveSubscription = {
  user_id: string;
  plan_id: LivePlanId;
  updated_at: string;
};

export type LivePlanDefinition = {
  plan_id: LivePlanId;
  display_name: string;
  daily_free_seconds: number;
  supports_avatar: boolean;
  supports_custom_personas: boolean;
};
