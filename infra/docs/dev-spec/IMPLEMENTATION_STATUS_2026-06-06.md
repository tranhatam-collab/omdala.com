# OMDALA Pricing & Promo Engine — Implementation Status
## Date: 2026-06-06 | Working branch seen locally: `audit-omdala-infra`

---

## True State

- Code exists locally under `packages/billing` and `infra/docs/dev-spec`
- Files are still untracked in the current checkout
- `feat/pricing-promo-engine` push is not verified from this working tree
- Test/build claims were previously overstated and are now under re-verification

## Current Components

### 1. Pricing & Promo Engine (`feat/pricing-promo-engine`)

| Component | File | Status |
|-----------|------|--------|
| Pricing schema (5 packages, EN/USD + VI/VND) | `packages/billing/src/pricing-schema.json` | present |
| Schema helpers | `packages/billing/src/schema.ts` | present |
| Promo state machine | `packages/billing/src/promo-state-machine.ts` | present; P0 logic aligned |
| Price calculator | `packages/billing/src/price-calculator.ts` | present |
| Checkout router | `packages/billing/src/checkout-router.ts` | present; schema-driven account routing |
| Market resolver | `packages/billing/src/market-resolver.ts` | present; localized monthly suffix fixed |
| Analytics events | `packages/billing/src/analytics-events.ts` | present |
| Public API index | `packages/billing/src/index.ts` | present |
| Dev spec | `infra/docs/dev-spec/PRICING_PROMO_ENGINE_SPEC.md` | present |

### 2. Rule Lock

- **Trial**: 30 days free
- **Promo**: 90% off for 3 monthly billing cycles after trial
- **Enterprise**: eligible for promo if monthly
- **Prepay ladder**: Annual 20%, 2-year 30%, 3-year 50%
- **Monthly after promo**: returns to base price (no discount)
- **Markets**: EN/USD (international) + VI/VND (Vietnam)
- **Entities**: US entity (international) + Viet Can New (Vietnam)
- **No FX conversion**: 2 independent price tables

### 3. Promo State Machine

```
lead → trial (30 days) → active_monthly
trial_expired + subscribe_within_grace → promo_1 → promo_2 → promo_3 → active_monthly
trial/expired + annual|biennial|triennial → active_*
```

### 4. Team Handoff

| Team | File | Task |
|------|------|------|
| **Frontend** | `market-resolver.ts` + `pricing-schema.json` | Build pricing page with locale switcher |
| **Backend** | `promo-state-machine.ts` + `checkout-router.ts` | Implement trial/subscription API |
| **QA** | `PRICING_PROMO_ENGINE_SPEC.md` §7 | Run acceptance criteria Gherkin tests |
| **Analytics** | `analytics-events.ts` | Wire events to Segment/Mixpanel |
| **DevOps** | `pricing-schema.json` | Version control price changes |

### 5. Verification Status

- `npm --prefix packages/billing run test`: script corrected to build before test, but not yet verified green in this environment
- `npm --prefix packages/billing run build`: requires local TypeScript toolchain presence
- `git push` / remote branch truth: not verified from current checkout

### 6. Next Step

1. Verify local toolchain and run build/test for `packages/billing`
2. Stage and commit tracked files from the real working directory
3. Verify remote branch truth before any merge or founder-ready claim

---

**Status: REVIEW_STATE_ONLY**
