/**
 * Price Calculator
 * Computes effective price given package, market, billing mode, and subscription state.
 */

import type { SubscriptionState } from "./promo-state-machine.js";
import type { PackageConfig, PricingConfig } from "./schema.js";

export class PriceCalculator {
  private config: PricingConfig;

  constructor(config: PricingConfig) {
    this.config = config;
  }

  getPackage(pkgId: string): PackageConfig | undefined {
    return this.config.packages.find((p) => p.id === pkgId);
  }

  getBasePrice(pkgId: string, market: string, billingMode: string): number {
    const pkg = this.getPackage(pkgId);
    if (!pkg) throw new Error(`Unknown package: ${pkgId}`);
    if (!pkg.billingModes.includes(billingMode as import("./schema.js").BillingMode)) {
      throw new Error(`Package ${pkgId} does not support ${billingMode}`);
    }
    const marketPrices = pkg.prices[market];
    if (!marketPrices) throw new Error(`No prices for market: ${market}`);
    const price = marketPrices[billingMode];
    if (price === undefined) throw new Error(`No price for ${billingMode} in ${market}`);
    return price;
  }

  getSetupPrice(pkgId: string, market: string): { min: number; max: number } | null {
    const pkg = this.getPackage(pkgId);
    if (!pkg?.setupPrice) return null;
    return pkg.setupPrice[market] ?? null;
  }

  /**
   * Calculate the invoice amount for the current billing period.
   */
  calculateInvoice(
    pkgId: string,
    market: string,
    billingMode: string,
    state: SubscriptionState
  ): { amount: number; currency: string; breakdown: string[] } {
    const pkg = this.getPackage(pkgId);
    if (!pkg) throw new Error(`Unknown package: ${pkgId}`);

    const marketConfig = this.config.markets[market as import("./schema.js").Market];
    if (!marketConfig) throw new Error(`Unknown market: ${market}`);
    const currency = marketConfig.currency;
    const breakdown: string[] = [];

    // Trial = free
    if (state === "trial") {
      return { amount: 0, currency, breakdown: ["Trial period — no charge"] };
    }

    // Promo months (only for monthly billing)
    if (state.startsWith("promo_")) {
      if (billingMode !== "monthly") {
        throw new Error("Promo pricing is only valid for monthly billing");
      }
      if (!pkg.promo.enabled || pkg.promo.discountRate === undefined) {
        throw new Error(`Package ${pkgId} is not eligible for promo pricing`);
      }
      const base = this.getBasePrice(pkgId, market, "monthly");
      const promoRate = pkg.promo.discountRate;
      const precision = currency === "VND" ? 0 : 2;
      const amount = Number((base * (1 - promoRate)).toFixed(precision));
      breakdown.push(`Base monthly: ${base} ${currency}`);
      breakdown.push(`Promo discount: ${promoRate * 100}% off`);
      breakdown.push(`Effective: ${amount.toFixed(2)} ${currency}`);
      return { amount, currency, breakdown };
    }

    // Prepay modes
    const baseMonthly = this.getBasePrice(pkgId, market, "monthly");
    let multiplier = 1;
    let discountLabel = "";

    switch (billingMode) {
      case "annual":
        multiplier = 12;
        discountLabel = "annual (20% off)";
        break;
      case "biennial":
        multiplier = 24;
        discountLabel = "2-year (30% off)";
        break;
      case "triennial":
        multiplier = 36;
        discountLabel = "3-year (50% off)";
        break;
      case "monthly":
        multiplier = 1;
        discountLabel = "monthly";
        break;
    }

    // If they switched from promo to prepay, use the prepay price directly (no double discount)
    const amount = this.getBasePrice(pkgId, market, billingMode);
    breakdown.push(`Base monthly: ${baseMonthly} ${currency}`);
    breakdown.push(`Billing mode: ${discountLabel}`);
    breakdown.push(`Period multiplier: ${multiplier}`);
    breakdown.push(`Total: ${amount.toFixed(2)} ${currency}`);

    return { amount, currency, breakdown };
  }

  /**
   * Calculate effective monthly rate for display purposes.
   */
  getEffectiveMonthlyRate(pkgId: string, market: string, billingMode: string): number {
    const total = this.getBasePrice(pkgId, market, billingMode);
    switch (billingMode) {
      case "annual": return total / 12;
      case "biennial": return total / 24;
      case "triennial": return total / 36;
      default: return total;
    }
  }

  /**
   * List all packages with computed prices for a market.
   */
  listPackagesForMarket(market: string): Array<{
    id: string;
    name: string;
    prices: Record<string, number>;
    effectiveMonthly: number;
    trialDays: number;
    promoEnabled: boolean;
  }> {
    return this.config.packages.map((pkg) => {
      const name = pkg.name[market] ?? pkg.name["en"];
      const prices: Record<string, number> = {};
      pkg.billingModes.forEach((mode) => {
        prices[mode] = this.getBasePrice(pkg.id, market, mode);
      });
      return {
        id: pkg.id,
        name,
        prices,
        effectiveMonthly: this.getEffectiveMonthlyRate(pkg.id, market, "monthly"),
        trialDays: pkg.trialDays,
        promoEnabled: pkg.promo.enabled,
      };
    });
  }
}
