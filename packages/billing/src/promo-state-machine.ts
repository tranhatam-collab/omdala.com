import {
  getPackageConfig,
  getPricingConfig,
  isPromoEligible,
  isTrialEligible,
} from "./schema.js";

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

export type SubscriptionEvent =
  | "start_trial"
  | "trial_expires"
  | "convert"
  | "subscribe_within_grace"
  | "subscribe"
  | "month_end"
  | "switch_annual"
  | "switch_biennial"
  | "switch_triennial"
  | "cancel";

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
  event: SubscriptionEvent;
  to: SubscriptionState;
  condition?: (sub: Subscription, now: Date) => boolean;
}

const TRANSITIONS: Transition[] = [
  { from: "lead", event: "start_trial", to: "trial" },
  { from: "trial", event: "trial_expires", to: "trial_expired" },
  { from: "trial", event: "convert", to: "promo_1", condition: (s) => isPromoEligible(s.packageId, s.billingMode) },
  { from: "trial", event: "convert", to: "active_monthly", condition: (s) => s.billingMode === "monthly" },
  { from: "trial", event: "convert", to: "active_annual", condition: (s) => s.billingMode === "annual" },
  { from: "trial", event: "convert", to: "active_biennial", condition: (s) => s.billingMode === "biennial" },
  { from: "trial", event: "convert", to: "active_triennial", condition: (s) => s.billingMode === "triennial" },
  { from: "trial_expired", event: "subscribe_within_grace", to: "promo_1", condition: (s, now) => withinGracePeriod(s, now) && isPromoEligible(s.packageId, s.billingMode) },
  { from: "trial_expired", event: "subscribe", to: "promo_1", condition: (s, now) => withinGracePeriod(s, now) && isPromoEligible(s.packageId, s.billingMode) },
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
  { from: "active_biennial", event: "cancel", to: "cancelled" },
  { from: "active_triennial", event: "cancel", to: "cancelled" },
  { from: "active_monthly", event: "cancel", to: "cancelled" },
  { from: "trial", event: "cancel", to: "cancelled" },
  { from: "trial_expired", event: "cancel", to: "cancelled" },
  { from: "promo_1", event: "cancel", to: "cancelled" },
  { from: "promo_2", event: "cancel", to: "cancelled" },
  { from: "promo_3", event: "cancel", to: "cancelled" },
];

const GRACE_PERIOD_DAYS = 7;

export function withinGracePeriod(sub: Subscription, now: Date): boolean {
  if (!sub.trialEndDate) return false;
  const trialEnd = new Date(sub.trialEndDate);
  if (Number.isNaN(trialEnd.getTime())) return false;
  const diffDays = (now.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= GRACE_PERIOD_DAYS;
}

export function getNextState(
  current: SubscriptionState,
  event: SubscriptionEvent,
  subscription: Subscription,
  now: Date = new Date()
): SubscriptionState | null {
  if (event === "start_trial" && !isTrialEligible(subscription.packageId)) {
    return null;
  }

  const candidates = TRANSITIONS.filter(
    (t) => t.from === current && t.event === event
  );
  for (const t of candidates) {
    if (!t.condition || t.condition(subscription, now)) {
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
  event: SubscriptionEvent,
  now: Date = new Date()
): Subscription {
  const next = getNextState(sub.state, event, sub, now);
  if (!next) {
    throw new Error(`Invalid transition: ${sub.state} + ${event}`);
  }

  const updated: Subscription = { ...sub, state: next };

  // Auto-set dates on specific transitions
  if (event === "start_trial") {
    const start = new Date(now);
    updated.trialStartDate = start.toISOString();
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + getPackageConfig(sub.packageId).trialDays);
    updated.trialEndDate = end.toISOString();
  }

  if (next === "promo_1") {
    updated.promoStartDate = now.toISOString();
    updated.promoMonthIndex = 1;
  }
  if (next === "promo_2") updated.promoMonthIndex = 2;
  if (next === "promo_3") updated.promoMonthIndex = 3;

  if (event === "cancel") {
    updated.cancelledAt = now.toISOString();
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
  const roundMoney = (amount: number) => Number(amount.toFixed(sub.market === "vi" ? 0 : 2));

  switch (sub.state) {
    case "trial":
      return 0;
    case "promo_1":
    case "promo_2":
    case "promo_3": {
      if (!isPromoEligible(sub.packageId, sub.billingMode)) {
        throw new Error(`Package ${sub.packageId} is not eligible for monthly promo pricing`);
      }
      const discountRate = getPackageConfig(sub.packageId).promo.discountRate;
      if (discountRate === undefined) {
        throw new Error(`Package ${sub.packageId} has no promo discount rate`);
      }
      return roundMoney(baseMonthly * (1 - discountRate));
    }
    case "active_monthly":
      return baseMonthly;
    case "active_annual":
      return roundMoney(baseMonthly * 12 * (1 - getPricingConfig().discounts.prepay.annual.rate));
    case "active_biennial":
      return roundMoney(baseMonthly * 24 * (1 - getPricingConfig().discounts.prepay.biennial.rate));
    case "active_triennial":
      return roundMoney(baseMonthly * 36 * (1 - getPricingConfig().discounts.prepay.triennial.rate));
    default:
      return 0;
  }
}
