import type {
  OmAiBetaGate,
  OmAiBillingSubscription,
  OmAiPlanId,
  OmAiUsageEventName,
} from "@omdala/types";

export const OM_AI_APP_ID = "om-ai" as const;

export const OM_AI_PLAN_IDS = {
  free: "om-ai-free",
  pro: "om-ai-pro",
  family: "om-ai-family",
  school: "om-ai-school",
  business: "om-ai-business",
} as const satisfies Record<string, OmAiPlanId>;

export const OM_AI_USAGE_EVENT_NAMES = {
  callStarted: "om-ai.call.started",
  callEnded: "om-ai.call.ended",
  recapGenerated: "om-ai.recap.generated",
  subscriptionChanged: "om-ai.subscription.changed",
  usageMinuteRecorded: "om-ai.usage.minute-recorded",
} as const satisfies Record<string, OmAiUsageEventName>;

export const OM_AI_FREE_DAILY_CALL_MINUTES = 30;

export const OM_AI_BETA_ALLOWED_STATUSES = [
  "active",
  "trialing",
] as const satisfies readonly OmAiBillingSubscription["status"][];

export const OM_AI_BETA_ALLOWED_PLAN_IDS = [
  OM_AI_PLAN_IDS.pro,
  OM_AI_PLAN_IDS.family,
  OM_AI_PLAN_IDS.school,
  OM_AI_PLAN_IDS.business,
] as const satisfies readonly OmAiPlanId[];

export function resolveOmAiBetaGate(
  subscription: Pick<OmAiBillingSubscription, "status" | "planId">,
): OmAiBetaGate {
  const statusAllowed = (
    OM_AI_BETA_ALLOWED_STATUSES as readonly OmAiBillingSubscription["status"][]
  ).includes(subscription.status);
  if (!statusAllowed) {
    return {
      isUnlocked: false,
      reason: "subscription_inactive",
      status: subscription.status,
      planId: subscription.planId,
      summary: "Beta access requires an active or trialing subscription.",
    };
  }

  const planAllowed = (
    OM_AI_BETA_ALLOWED_PLAN_IDS as readonly OmAiPlanId[]
  ).includes(subscription.planId);
  if (!planAllowed) {
    return {
      isUnlocked: false,
      reason: "plan_not_eligible",
      status: subscription.status,
      planId: subscription.planId,
      summary: "Current plan is visible but not beta-eligible.",
    };
  }

  return {
    isUnlocked: true,
    reason: "eligible",
    status: subscription.status,
    planId: subscription.planId,
    summary: "Subscription is beta-eligible for Om AI private features.",
  };
}
