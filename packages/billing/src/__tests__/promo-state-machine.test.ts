import { test } from "node:test";
import assert from "node:assert";
import { applyTransition, getEffectivePrice, withinGracePeriod } from "../promo-state-machine.js";
import type { Subscription } from "../promo-state-machine.js";

const NOW = new Date("2026-08-29T00:00:00.000Z");

test("monthly billing stays free for the full trial before entering promo", () => {
  let sub: Subscription = {
    id: "sub_1", accountId: "acc_1", packageId: "infra-explore",
    market: "en", state: "lead", billingMode: "monthly",
    createdAt: NOW.toISOString(),
  };

  sub = applyTransition(sub, "start_trial", NOW);
  assert.strictEqual(sub.state, "trial");
  assert.strictEqual(sub.trialStartDate, "2026-08-29T00:00:00.000Z");
  assert.strictEqual(sub.trialEndDate, "2026-09-28T00:00:00.000Z");

  assert.throws(() => applyTransition(sub, "convert", NOW));

  sub = applyTransition(sub, "trial_expires", new Date("2026-09-28T00:00:00.000Z"));
  assert.strictEqual(sub.state, "trial_expired");
  sub = applyTransition(sub, "subscribe_within_grace", new Date("2026-09-28T00:00:00.000Z"));
  assert.strictEqual(sub.state, "promo_1");
  assert.throws(() => applyTransition(sub, "month_end", NOW));
  sub = applyTransition(sub, "month_end", new Date("2026-10-28T00:00:00.000Z"));
  assert.strictEqual(sub.state, "promo_2");
  sub = applyTransition(sub, "month_end", new Date("2026-11-28T00:00:00.000Z"));
  assert.strictEqual(sub.state, "promo_3");
  sub = applyTransition(sub, "month_end", new Date("2026-12-28T00:00:00.000Z"));
  assert.strictEqual(sub.state, "active_monthly");
});

test("promo state machine: trial_expired → promo_1 → promo_2 → promo_3 → active_monthly", () => {
  let sub: Subscription = {
    id: "sub_1b", accountId: "acc_1", packageId: "infra-explore",
    market: "en", state: "trial_expired", billingMode: "monthly",
    createdAt: NOW.toISOString(),
    trialEndDate: "2026-08-27T00:00:00.000Z",
  };

  sub = applyTransition(sub, "subscribe_within_grace", NOW);
  assert.strictEqual(sub.state, "promo_1");
  assert.strictEqual(sub.promoMonthIndex, 1);

  sub = applyTransition(sub, "month_end", new Date("2026-09-29T00:00:00.000Z"));
  assert.strictEqual(sub.state, "promo_2");

  sub = applyTransition(sub, "month_end", new Date("2026-10-29T00:00:00.000Z"));
  assert.strictEqual(sub.state, "promo_3");

  sub = applyTransition(sub, "month_end", new Date("2026-11-29T00:00:00.000Z"));
  assert.strictEqual(sub.state, "active_monthly");
});

test("promo month end rejects early, repeated, and stale billing events", () => {
  const promo1: Subscription = {
    id: "sub_period", accountId: "acc_period", packageId: "infra-explore",
    market: "en", state: "promo_1", billingMode: "monthly",
    createdAt: NOW.toISOString(), promoStartDate: NOW.toISOString(), promoMonthIndex: 1,
  };
  const firstEnd = new Date("2026-09-29T00:00:00.000Z");
  assert.throws(() => applyTransition(promo1, "month_end", new Date("2026-09-28T23:59:59.999Z")));
  assert.throws(() => {
    // @ts-expect-error JavaScript callers must also supply the billing event time.
    applyTransition(promo1, "month_end");
  });

  const promo2 = applyTransition(promo1, "month_end", firstEnd);
  assert.strictEqual(promo2.state, "promo_2");
  assert.throws(() => applyTransition(promo2, "month_end", firstEnd));
  assert.throws(() => applyTransition(promo2, "month_end", new Date("2026-09-30T00:00:00.000Z")));
  assert.throws(() => applyTransition(promo1, "month_end", new Date("2026-10-29T00:00:00.000Z")));
});

test("promo calendar months clamp to month end while retaining the original anchor", () => {
  const promo1: Subscription = {
    id: "sub_month_end", accountId: "acc_month_end", packageId: "infra-explore",
    market: "en", state: "promo_1", billingMode: "monthly",
    createdAt: "2027-01-31T12:00:00.000Z",
    promoStartDate: "2027-01-31T12:00:00.000Z", promoMonthIndex: 1,
  };
  assert.throws(() => applyTransition(promo1, "month_end", new Date("2027-02-28T11:59:59.999Z")));
  const promo2 = applyTransition(promo1, "month_end", new Date("2027-02-28T12:00:00.000Z"));
  assert.throws(() => applyTransition(promo2, "month_end", new Date("2027-03-30T12:00:00.000Z")));
  const promo3 = applyTransition(promo2, "month_end", new Date("2027-03-31T12:00:00.000Z"));
  assert.strictEqual(applyTransition(promo3, "month_end", new Date("2027-04-30T12:00:00.000Z")).state, "active_monthly");
});

test("promo month end fails closed without consistent period metadata", () => {
  const base: Subscription = {
    id: "sub_missing_period", accountId: "acc_missing_period", packageId: "infra-explore",
    market: "en", state: "promo_1", billingMode: "monthly", createdAt: NOW.toISOString(),
  };
  const due = new Date("2026-09-29T00:00:00.000Z");
  assert.throws(() => applyTransition(base, "month_end", due));
  assert.throws(() => applyTransition({ ...base, promoStartDate: "invalid", promoMonthIndex: 1 }, "month_end", due));
  assert.throws(() => applyTransition({ ...base, promoStartDate: NOW.toISOString(), promoMonthIndex: 2 }, "month_end", due));
});

test("annual billing skips promo, goes to active_annual", () => {
  let sub: Subscription = {
    id: "sub_2", accountId: "acc_2", packageId: "infra-explore",
    market: "en", state: "trial", billingMode: "annual",
    createdAt: NOW.toISOString(),
  };
  sub = applyTransition(sub, "convert", NOW);
  assert.strictEqual(sub.state, "active_annual");
});

test("price calculation: promo = 10% of base", () => {
  const sub: Subscription = {
    id: "sub_3", accountId: "acc_3", packageId: "infra-explore",
    market: "en", state: "promo_1", billingMode: "monthly",
    createdAt: NOW.toISOString(),
  };
  assert.strictEqual(getEffectivePrice(100, sub), 10);
});

test("price calculation: triennial = 50% off over 36 months", () => {
  const sub: Subscription = {
    id: "sub_4", accountId: "acc_4", packageId: "infra-explore",
    market: "en", state: "active_triennial", billingMode: "triennial",
    createdAt: NOW.toISOString(),
  };
  assert.strictEqual(getEffectivePrice(100, sub), 1800);
});

test("ai-agent-ops cannot start trial", () => {
  const sub: Subscription = {
    id: "sub_5", accountId: "acc_5", packageId: "ai-agent-ops",
    market: "en", state: "lead", billingMode: "monthly",
    createdAt: NOW.toISOString(),
  };
  assert.throws(() => applyTransition(sub, "start_trial"));
});

test("ai-agent-ops cannot enter promo", () => {
  const sub: Subscription = {
    id: "sub_6", accountId: "acc_6", packageId: "ai-agent-ops",
    market: "en", state: "trial_expired", billingMode: "monthly",
    createdAt: NOW.toISOString(),
    trialEndDate: "2026-08-27T00:00:00.000Z",
  };
  assert.throws(() => applyTransition(sub, "subscribe_within_grace", NOW));
});

test("enterprise monthly cannot bypass the free trial into promo", () => {
  const sub: Subscription = {
    id: "sub_enterprise", accountId: "acc_enterprise", packageId: "infra-enterprise",
    market: "en", state: "trial", billingMode: "monthly", createdAt: NOW.toISOString(),
  };
  assert.throws(() => applyTransition(sub, "convert", NOW));
});

test("trial cannot expire before its recorded end date", () => {
  const sub: Subscription = {
    id: "sub_early_expiry", accountId: "acc_early_expiry", packageId: "infra-explore",
    market: "en", state: "trial", billingMode: "monthly",
    createdAt: NOW.toISOString(), trialEndDate: "2026-09-28T00:00:00.000Z",
  };

  assert.throws(() => applyTransition(sub, "trial_expires", NOW));
});

test("future trial end is not treated as grace period", () => {
  const sub: Subscription = {
    id: "sub_future", accountId: "acc_future", packageId: "infra-explore",
    market: "en", state: "trial_expired", billingMode: "monthly",
    createdAt: NOW.toISOString(), trialEndDate: "2026-08-30T00:00:00.000Z",
  };
  assert.strictEqual(withinGracePeriod(sub, NOW), false);
  assert.throws(() => applyTransition(sub, "subscribe_within_grace", NOW));
});

test("monthly subscription after grace uses the regular price", () => {
  const sub: Subscription = {
    id: "sub_late", accountId: "acc_late", packageId: "infra-explore",
    market: "en", state: "trial_expired", billingMode: "monthly",
    createdAt: NOW.toISOString(), trialEndDate: "2026-08-20T00:00:00.000Z",
  };
  assert.strictEqual(applyTransition(sub, "subscribe", NOW).state, "active_monthly");
});

test("promo price rejects a package that is not promo eligible", () => {
  const sub: Subscription = {
    id: "sub_invalid_promo", accountId: "acc_invalid", packageId: "ai-agent-ops",
    market: "en", state: "promo_1", billingMode: "monthly", createdAt: NOW.toISOString(),
  };
  assert.throws(() => getEffectivePrice(100, sub), /not eligible/);
});

test("biennial and triennial subscriptions can be cancelled", () => {
  for (const [state, billingMode] of [
    ["active_biennial", "biennial"],
    ["active_triennial", "triennial"],
  ] as const) {
    const sub: Subscription = {
      id: `sub_${state}`, accountId: "acc_cancel", packageId: "infra-explore",
      market: "en", state, billingMode, createdAt: NOW.toISOString(),
    };
    const cancelled = applyTransition(sub, "cancel", NOW);
    assert.strictEqual(cancelled.state, "cancelled");
    assert.strictEqual(cancelled.cancelledAt, NOW.toISOString());
  }
});
