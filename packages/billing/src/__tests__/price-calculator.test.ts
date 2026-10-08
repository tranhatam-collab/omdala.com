import { test } from "node:test";
import assert from "node:assert";
import { PriceCalculator } from "../price-calculator.js";
import pricingSchema from "../pricing-schema.json" with { type: "json" };
import type { PricingConfig } from "../schema.js";

const calc = new PriceCalculator(pricingSchema as PricingConfig);

test("getBasePrice: infra-explore monthly EN = 99", () => {
  assert.strictEqual(calc.getBasePrice("infra-explore", "en", "monthly"), 99);
});

test("getBasePrice: infra-explore annual EN = 950.40", () => {
  assert.strictEqual(calc.getBasePrice("infra-explore", "en", "annual"), 950.40);
});

test("invoice: trial = 0", () => {
  const result = calc.calculateInvoice("infra-explore", "en", "monthly", "trial");
  assert.strictEqual(result.amount, 0);
  assert.ok(result.breakdown.some((b) => b.includes("Trial")));
});

test("invoice: promo_1 monthly = 10% of base", () => {
  const result = calc.calculateInvoice("infra-explore", "en", "monthly", "promo_1");
  assert.strictEqual(result.amount, 9.9); // 99 * 0.10, rounded to USD cents
});

test("invoice: VND promo amount is rounded to a whole dong", () => {
  const result = calc.calculateInvoice("infra-explore", "vi", "monthly", "promo_1");
  assert.strictEqual(result.amount, 240000);
});

test("invoice: promo state fails closed for non-monthly billing", () => {
  assert.throws(
    () => calc.calculateInvoice("infra-explore", "en", "annual", "promo_1"),
    /only valid for monthly/
  );
});

test("invoice: promo state fails closed for ineligible package", () => {
  assert.throws(
    () => calc.calculateInvoice("ai-agent-ops", "en", "monthly", "promo_1"),
    /not eligible/
  );
});

test("invoice: unknown market fails closed instead of defaulting to USD", () => {
  assert.throws(
    () => calc.calculateInvoice("infra-explore", "fr", "monthly", "active_monthly"),
    /Unknown market/
  );
});

test("invoice: active_monthly = base price", () => {
  const result = calc.calculateInvoice("infra-explore", "en", "monthly", "active_monthly");
  assert.strictEqual(result.amount, 99);
});

test("invoice: active_annual = annual base (already discounted)", () => {
  const result = calc.calculateInvoice("infra-explore", "en", "annual", "active_annual");
  assert.strictEqual(result.amount, 950.40);
});

test("effective monthly rate: annual = total / 12", () => {
  const rate = calc.getEffectiveMonthlyRate("infra-explore", "en", "annual");
  assert.strictEqual(rate, 79.2); // 950.40 / 12
});

test("listPackagesForMarket returns all packages", () => {
  const list = calc.listPackagesForMarket("en");
  assert.strictEqual(list.length, 5);
  assert.ok(list.every((p) => p.prices.monthly > 0 || p.id === "ai-agent-ops"));
});
