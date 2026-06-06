/**
 * @omdala/billing — Public API
 * Pricing, promo, checkout, and analytics for OMDALA infra.
 */

export {
  type Market,
  detectMarketFromBrowser,
  getMarketConfig,
  persistMarket,
  loadPersistedMarket,
  resolveMarket,
  formatPrice,
  formatEffectiveMonthly,
} from "./market-resolver.js";

export {
  type Subscription,
  type SubscriptionState,
  applyTransition,
  getNextState,
  isPromoActive,
  getEffectivePrice,
} from "./promo-state-machine.js";

export {
  PriceCalculator,
} from "./price-calculator.js";

export {
  type BillingMode,
  type MarketConfig,
  type PackageConfig,
  type PricingConfig,
  getPricingConfig,
  getMarketConfigFromSchema,
  getPackageConfig,
  isTrialEligible,
  isPromoEligible,
} from "./schema.js";

export {
  type CheckoutContext,
  type CheckoutResult,
  resolveCheckout,
  buildInvoiceMetadata,
  validateNoMixedEntity,
} from "./checkout-router.js";

export {
  type PricingEvent,
  type PricingEventType,
  createEvent,
  emitEvent,
  trackPricingPageView,
  trackTrialStart,
  trackCheckout,
} from "./analytics-events.js";
