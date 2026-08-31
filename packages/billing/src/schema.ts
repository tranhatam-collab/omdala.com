import pricingSchema from "./pricing-schema.json" with { type: "json" };

export type Market = "en" | "vi";
export type BillingMode = "monthly" | "annual" | "biennial" | "triennial";

export interface MarketConfig {
  language: "en" | "vi";
  currency: "USD" | "VND";
  entity: "us_entity" | "viet_can_new";
  locale: string;
  stripeAccount: string | null;
}

export interface PackageConfig {
  id: string;
  name: Record<string, string>;
  tier: string;
  billingModes: BillingMode[];
  prices: Record<string, Record<string, number>>;
  setupPrice?: Record<string, { min: number; max: number }>;
  trialDays: number;
  promo: { enabled: boolean; discountRate?: number; durationMonths?: number };
  features: string[];
  negotiable?: boolean;
}

export interface PricingConfig {
  version: string;
  markets: Record<Market, MarketConfig>;
  packages: PackageConfig[];
  discounts: {
    trial: { days: number; scope: string[] };
    promo: { rate: number; durationMonths: number; scope: string[] };
    prepay: Record<string, { rate: number; label: string }>;
  };
}

const config = pricingSchema as PricingConfig;

export function getPricingConfig(): PricingConfig {
  return config;
}

export function getMarketConfigFromSchema(market: Market): MarketConfig {
  const found = config.markets[market];
  if (!found) {
    throw new Error(`Unknown market: ${market}`);
  }
  return found;
}

export function getPackageConfig(packageId: string): PackageConfig {
  const found = config.packages.find((pkg) => pkg.id === packageId);
  if (!found) {
    throw new Error(`Unknown package: ${packageId}`);
  }
  return found;
}

export function isTrialEligible(packageId: string): boolean {
  const pkg = getPackageConfig(packageId);
  return pkg.trialDays > 0;
}

export function isPromoEligible(packageId: string, billingMode: BillingMode): boolean {
  const pkg = getPackageConfig(packageId);
  return billingMode === "monthly" && pkg.promo.enabled === true;
}
