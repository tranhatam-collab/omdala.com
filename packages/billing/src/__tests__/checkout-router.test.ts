import { test } from "node:test";
import assert from "node:assert";
import { resolveCheckout, validateNoMixedEntity } from "../checkout-router.js";
import type { CheckoutContext } from "../checkout-router.js";

test("EN checkout routes to US entity + Stripe", () => {
  const ctx: CheckoutContext = {
    market: "en", packageId: "infra-pilot", billingMode: "monthly",
    userId: "u1", email: "test@example.com",
  };
  const result = resolveCheckout(ctx);
  assert.strictEqual(result.entity, "us_entity");
  assert.strictEqual(result.currency, "USD");
  assert.strictEqual(result.paymentMethod, "stripe");
  assert.strictEqual(result.stripeAccountId, "acct_us");
});

test("VI checkout routes to Viet Can New + bank transfer", () => {
  const ctx: CheckoutContext = {
    market: "vi", packageId: "infra-pilot", billingMode: "monthly",
    userId: "u1", email: "test@company.vn",
  };
  const result = resolveCheckout(ctx);
  assert.strictEqual(result.entity, "viet_can_new");
  assert.strictEqual(result.currency, "VND");
  assert.strictEqual(result.paymentMethod, "local_bank_transfer");
});

test("mixed entity checkout is rejected", () => {
  assert.throws(() => {
    validateNoMixedEntity([
      { market: "en", packageId: "infra-pilot" },
      { market: "vi", packageId: "infra-growth" },
    ]);
  });
});
