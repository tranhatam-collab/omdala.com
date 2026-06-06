import { test } from "node:test";
import assert from "node:assert";
import { applyTransition, getEffectivePrice } from "../promo-state-machine.js";
import type { Subscription } from "../promo-state-machine.js";

test("promo state machine: lead → trial → active_monthly", () => {
  let sub: Subscription = {
    id: "sub_1", accountId: "acc_1", packageId: "infra-explore",
    market: "en", state: "lead", billingMode: "monthly",
    createdAt: new Date().toISOString(),
  };

  sub = applyTransition(sub, "start_trial");
  assert.strictEqual(sub.state, "trial");
  assert.ok(sub.trialStartDate);
  assert.ok(sub.trialEndDate);

  sub = applyTransition(sub, "convert");
  assert.strictEqual(sub.state, "active_monthly");
});

test("promo state machine: trial_expired → promo_1 → promo_2 → promo_3 → active_monthly", () => {
  let sub: Subscription = {
    id: "sub_1b", accountId: "acc_1", packageId: "infra-explore",
    market: "en", state: "trial_expired", billingMode: "monthly",
    createdAt: new Date().toISOString(),
    trialEndDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  };

  sub = applyTransition(sub, "subscribe_within_grace");
  assert.strictEqual(sub.state, "promo_1");
  assert.strictEqual(sub.promoMonthIndex, 1);

  sub = applyTransition(sub, "month_end");
  assert.strictEqual(sub.state, "promo_2");

  sub = applyTransition(sub, "month_end");
  assert.strictEqual(sub.state, "promo_3");

  sub = applyTransition(sub, "month_end");
  assert.strictEqual(sub.state, "active_monthly");
});

test("annual billing skips promo, goes to active_annual", () => {
  let sub: Subscription = {
    id: "sub_2", accountId: "acc_2", packageId: "infra-explore",
    market: "en", state: "trial", billingMode: "annual",
    createdAt: new Date().toISOString(),
  };
  sub = applyTransition(sub, "convert");
  assert.strictEqual(sub.state, "active_annual");
});

test("price calculation: promo = 10% of base", () => {
  const sub: Subscription = {
    id: "sub_3", accountId: "acc_3", packageId: "infra-explore",
    market: "en", state: "promo_1", billingMode: "monthly",
    createdAt: new Date().toISOString(),
  };
  assert.strictEqual(getEffectivePrice(100, sub), 10);
});

test("price calculation: triennial = 50% off over 36 months", () => {
  const sub: Subscription = {
    id: "sub_4", accountId: "acc_4", packageId: "infra-explore",
    market: "en", state: "active_triennial", billingMode: "triennial",
    createdAt: new Date().toISOString(),
  };
  assert.strictEqual(getEffectivePrice(100, sub), 1800);
});

test("ai-agent-ops cannot start trial", () => {
  const sub: Subscription = {
    id: "sub_5", accountId: "acc_5", packageId: "ai-agent-ops",
    market: "en", state: "lead", billingMode: "monthly",
    createdAt: new Date().toISOString(),
  };
  assert.throws(() => applyTransition(sub, "start_trial"));
});

test("ai-agent-ops cannot enter promo", () => {
  const sub: Subscription = {
    id: "sub_6", accountId: "acc_6", packageId: "ai-agent-ops",
    market: "en", state: "trial_expired", billingMode: "monthly",
    createdAt: new Date().toISOString(),
    trialEndDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  };
  assert.throws(() => applyTransition(sub, "subscribe_within_grace"));
});
