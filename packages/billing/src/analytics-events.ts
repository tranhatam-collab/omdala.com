/**
 * Analytics Events for Pricing & Checkout
 */

export type PricingEventType =
  | "pricing_page_viewed"
  | "package_viewed"
  | "trial_started"
  | "trial_expired"
  | "promo_activated"
  | "checkout_initiated"
  | "checkout_completed"
  | "checkout_failed"
  | "plan_changed"
  | "cancel_initiated"
  | "cancel_completed";

export interface PricingEvent {
  event: PricingEventType;
  timestamp: string;
  userId: string;
  anonymousId?: string;
  market: "en" | "vi";
  packageId: string;
  billingMode?: "monthly" | "annual" | "biennial" | "triennial";
  value?: number;
  currency?: "USD" | "VND";
  sessionId: string;
  referrer: string;
  browserLocale: string;
  chosenLocale: string;
  promoMonth?: 1 | 2 | 3;
  errorCode?: string;
  fromPackage?: string;
  toPackage?: string;
  reason?: string;
}

export function createEvent(
  type: PricingEventType,
  props: Omit<PricingEvent, "event" | "timestamp">
): PricingEvent {
  return {
    event: type,
    timestamp: new Date().toISOString(),
    ...props,
  };
}

export function emitEvent(event: PricingEvent): void {
  // In production: send to analytics endpoint (Segment, Mixpanel, or custom)
  // In development: log to console
  if (typeof console !== "undefined") {
    console.log("[Analytics]", event.event, event);
  }
}

export function trackPricingPageView(
  market: "en" | "vi",
  packageIds: string[],
  sessionId: string,
  browserLocale: string
): void {
  emitEvent(
    createEvent("pricing_page_viewed", {
      userId: "anonymous",
      market,
      packageId: packageIds[0] ?? "none",
      sessionId,
      referrer: typeof document !== "undefined" ? document.referrer : "",
      browserLocale,
      chosenLocale: market,
    })
  );
}

export function trackTrialStart(
  userId: string,
  packageId: string,
  market: "en" | "vi",
  sessionId: string,
  source: string
): void {
  emitEvent(
    createEvent("trial_started", {
      userId,
      market,
      packageId,
      sessionId,
      referrer: source,
      browserLocale: market,
      chosenLocale: market,
    })
  );
}

export function trackCheckout(
  type: "checkout_initiated" | "checkout_completed" | "checkout_failed",
  userId: string,
  packageId: string,
  market: "en" | "vi",
  billingMode: "monthly" | "annual" | "biennial" | "triennial",
  amount: number,
  currency: "USD" | "VND",
  sessionId: string,
  errorCode?: string
): void {
  emitEvent(
    createEvent(type, {
      userId,
      market,
      packageId,
      billingMode,
      value: amount,
      currency,
      sessionId,
      referrer: "",
      browserLocale: market,
      chosenLocale: market,
      errorCode,
    })
  );
}
