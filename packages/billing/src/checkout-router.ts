/**
 * Checkout Router
 * Routes checkout to correct entity, currency, and payment method based on market.
 */

import { getMarketConfigFromSchema, type BillingMode, type Market } from "./schema.js";

export interface CheckoutContext {
  market: Market;
  packageId: string;
  billingMode: BillingMode;
  userId: string;
  email: string;
  promoCode?: string;
  setupPurchase?: boolean; // one-time setup fee
}

export interface CheckoutResult {
  entity: "us_entity" | "viet_can_new";
  currency: "USD" | "VND";
  language: "en" | "vi";
  stripeAccountId?: string;
  paymentMethod: "stripe" | "local_bank_transfer" | "cash";
  invoiceTemplate: "us_standard" | "vietnam_local";
  taxMode: "exclusive" | "inclusive";
  requiredFields: string[];
}

export function resolveCheckout(ctx: CheckoutContext): CheckoutResult {
  // Validate: no cross-market trickery
  if (ctx.market !== "en" && ctx.market !== "vi") {
    throw new Error(`Invalid market: ${ctx.market}`);
  }

  const market = getMarketConfigFromSchema(ctx.market);
  const config: CheckoutResult = {
    entity: market.entity,
    currency: market.currency,
    language: market.language,
    stripeAccountId: market.stripeAccount ?? undefined,
    paymentMethod: ctx.market === "en" ? "stripe" : "local_bank_transfer",
    invoiceTemplate: ctx.market === "en" ? "us_standard" : "vietnam_local",
    taxMode: ctx.market === "en" ? "exclusive" : "inclusive",
    requiredFields:
      ctx.market === "en"
        ? ["email", "company_name", "country", "card"]
        : ["email", "company_name", "tax_id", "bank_account", "contact_phone"],
  };

  // Enterprise VI may use Stripe if explicitly configured
  if (ctx.market === "vi" && ctx.billingMode === "annual") {
    // Optional: allow Stripe for VI annual if configured
    // return { ...config, stripeAccountId: "acct_vn_omdala", paymentMethod: "stripe" };
  }

  return config;
}

export function buildInvoiceMetadata(
  ctx: CheckoutContext,
  amount: number,
  priceVersion: string
): Record<string, unknown> {
  const config = resolveCheckout(ctx);
  return {
    orderId: `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
    language: config.language,
    currency: config.currency,
    market: ctx.market === "en" ? "international" : "vietnam",
    contractEntity: config.entity,
    invoiceEntity: config.entity,
    pricingPlanId: ctx.packageId,
    priceAmount: amount,
    priceVersion,
    taxMode: config.taxMode,
    country: ctx.market === "en" ? "US" : "VN",
    billingMode: ctx.billingMode,
    promoApplied: false, // set by caller if applicable
    trialApplied: false,
    discountAmount: 0,
    setupPurchase: ctx.setupPurchase ?? false,
    userId: ctx.userId,
    email: ctx.email,
    createdAt: new Date().toISOString(),
  };
}

export function validateNoMixedEntity(
  items: Array<{ market: Market; packageId: string }>
): void {
  const entities = new Set(items.map((i) => getMarketConfigFromSchema(i.market).entity));
  if (entities.size > 1) {
    throw new Error(
      `Mixed entity checkout not allowed. Found: ${Array.from(entities).join(", ")}`
    );
  }
}
