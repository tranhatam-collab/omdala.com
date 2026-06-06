import { isPromoEligible, isTrialEligible } from "./schema.js";

/**
 * Promo State Machine
 * Manages: lead → trial → promo → active → cancelled
 */

export type SubscriptionState =
  | "lead"
  | "trial"
  | "trial_expired"
  | "promo_1"
  | "promo_2"
  | "promo_3"
  | "active_monthly"
  | "active_annual"
  | "active_biennial"
  | "active_triennial"
  | "cancelled";

export interface Subscription {
  id: string;
  accountId: string;
  packageId: string;
  market: "en" | "vi";
  state: SubscriptionState;
  trialStartDate?: string; // ISO date
  trialEndDate?: string;
  promoStartDate?: string;
  promoMonthIndex?: 0 | 1 | 2 | 3; // 0=not started, 1=promo_1, etc.
  billingMode: "monthly" | "annual" | "biennial" | "triennial";
  createdAt: string;
  cancelledAt?: string;
}

interface Transition {
  from: SubscriptionState;
  event: string;
  to: SubscriptionState;
  condition?: (sub: Subscription) => boolean;
}

const TRANSITIONS: Transition[] = [
  { from: "lead", event: "start_trial", to: "trial" },
  { from: "trial", event: "trial_expires", to: "trial_expired" },
  { from: "trial", event: "convert", to: "active_monthly", condition: (s) => s.billingMode === "monthly" },
  { from: "trial", event: "convert", to: "active_annual", condition: (s) => s.billingMode === "annual" },
  { from: "trial", event: "convert", to: "active_biennial", condition: (s) => s.billingMode === "biennial" },
  { from: "trial", event: "convert", to: "active_triennial", condition: (s) => s.billingMode === "triennial" },
  { from: "trial_expired", event: "subscribe_within_grace", to: "promo_1", condition: (s) => withinGracePeriod(s) && s.billingMode === "monthly" },
  { from: "trial_expired", event: "subscribe", to: "active_monthly", condition: (s) => s.billingMode === "monthly" },
  { from: "trial_expired", event: "subscribe", to: "active_annual", condition: (s) => s.billingMode === "annual" },
  { from: "trial_expired", event: "subscribe", to: "active_biennial", condition: (s) => s.billingMode === "biennial" },
  { from: "trial_expired", event: "subscribe", to: "active_triennial", condition: (s) => s.billingMode === "triennial" },
  { from: "promo_1", event: "month_end", to: "promo_2" },
  { from: "promo_2", event: "month_end", to: "promo_3" },
  { from: "promo_3", event: "month_end", to: "active_monthly" },
  { from: "active_monthly", event: "switch_annual", to: "active_annual" },
  { from: "active_monthly", event: "switch_biennial", to: "active_biennial" },
  { from: "active_monthly", event: "switch_triennial", to: "active_triennial" },
  { from: "active_annual", event: "cancel", to: "cancelled" },
  { from: "active_monthly", event: "cancel", to: "cancelled" },
  { from: "promo_1", event: "cancel", to: "cancelled" },
  { from: "promo_2", event: "cancel", to: "cancelled" },
  { from: "promo_3", event: "cancel", to: "cancelled" },
];

const GRACE_PERIOD_DAYS = 7;

function withinGracePeriod(sub: Subscription): boolean {
  if (!sub.trialEndDate) return false;
  const trialEnd = new Date(sub.trialEndDate);
  const now = new Date();
  const diffDays = (now.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= GRACE_PERIOD_DAYS;
}

export function getNextState(
  current: SubscriptionState,
  event: string,
  subscription: Subscription
): SubscriptionState | null {
  if (event === "start_trial" && !isTrialEligible(subscription.packageId)) {
    return null;
  }

  const candidates = TRANSITIONS.filter(
    (t) => t.from === current && t.event === event
  );
  for (const t of candidates) {
    if (!t.condition || t.condition(subscription)) {
      if (t.to === "promo_1" && !isPromoEligible(subscription.packageId, subscription.billingMode)) {
        return null;
      }
      return t.to;
    }
  }
  return null;
}

export function applyTransition(
  sub: Subscription,
  event: string
): Subscription {
  const next = getNextState(sub.state, event, sub);
  if (!next) {
    throw new Error(`Invalid transition: ${sub.state} + ${event}`);
  }

  const updated: Subscription = { ...sub, state: next };

  // Auto-set dates on specific transitions
  if (event === "start_trial") {
    const start = new Date();
    updated.trialStartDate = start.toISOString();
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    updated.trialEndDate = end.toISOString();
  }

  if (next === "promo_1") {
    updated.promoStartDate = new Date().toISOString();
    updated.promoMonthIndex = 1;
  }
  if (next === "promo_2") updated.promoMonthIndex = 2;
  if (next === "promo_3") updated.promoMonthIndex = 3;

  if (event === "cancel") {
    updated.cancelledAt = new Date().toISOString();
  }

  return updated;
}

export function isPromoActive(sub: Subscription): boolean {
  return sub.state === "promo_1" || sub.state === "promo_2" || sub.state === "promo_3";
}

export function getEffectivePrice(
  baseMonthly: number,
  sub: Subscription
): number {
  switch (sub.state) {
    case "trial":
      return 0;
    case "promo_1":
    case "promo_2":
    case "promo_3":
      return baseMonthly * 0.10; // 90% off
    case "active_monthly":
      return baseMonthly;
    case "active_annual":
      return baseMonthly * 12 * 0.80; // 20% off
    case "active_biennial":
      return baseMonthly * 24 * 0.70; // 30% off
    case "active_triennial":
      return baseMonthly * 36 * 0.50; // 50% off
    default:
      return 0;
  }
}
