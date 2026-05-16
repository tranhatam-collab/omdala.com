export type LiveProviderId = 'openai_realtime' | 'tavus' | 'heygen' | 'voice_only';

export type LiveRoutingContext = {
  workspaceType: 'personal' | 'family' | 'school' | 'business';
  planId: 'free' | 'personal_pro' | 'education_plus' | 'business' | 'enterprise_custom';
  avatarRequested: boolean;
  region?: string;
};

export type LiveRoutingDecision = {
  primary: LiveProviderId;
  fallback: LiveProviderId[];
  reason: string;
};

export class LiveProviderRouter {
  route(context: LiveRoutingContext): LiveRoutingDecision {
    if (context.planId === 'free') {
      return {
        primary: 'openai_realtime',
        fallback: ['voice_only'],
        reason: 'free_plan_cost_control',
      };
    }

    if (context.avatarRequested) {
      if (context.workspaceType === 'business') {
        return {
          primary: 'tavus',
          fallback: ['heygen', 'openai_realtime', 'voice_only'],
          reason: 'business_avatar_priority',
        };
      }

      return {
        primary: 'heygen',
        fallback: ['tavus', 'openai_realtime', 'voice_only'],
        reason: 'avatar_requested',
      };
    }

    return {
      primary: 'openai_realtime',
      fallback: ['voice_only'],
      reason: 'voice_first_default',
    };
  }
}
