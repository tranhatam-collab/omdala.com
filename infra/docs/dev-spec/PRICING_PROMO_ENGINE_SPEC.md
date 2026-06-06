# Pricing & Promo Engine — Dev Implementation Spec
## infra.omdala.com | Version 2026-06-06 | Branch: `feat/pricing-promo-engine`

---

## 1. Executive Summary

This spec implements the approved commercial strategy:
- **Trial**: 30 days free
- **Promo**: 90% off for 3 monthly billing cycles after trial
- **Long-term**: Annual 20%, 2-year 30%, 3-year 50%
- **Markets**: EN/USD (international) + VI/VND (Vietnam)
- **Entities**: US entity for international, Viet Can New for Vietnam

---

## 2. Pricing Schema

### 2.1 Package Registry

```json
{
  "version": "2026-06-06",
  "markets": {
    "en": { "language": "en", "currency": "USD", "entity": "us_entity", "locale": "en-US" },
    "vi": { "language": "vi", "currency": "VND", "entity": "viet_can_new", "locale": "vi-VN" }
  },
  "packages": [
    {
      "id": "infra-explore",
      "name": { "en": "Infra Explore", "vi": "Khám phá Hạ tầng" },
      "tier": "entry",
      "billingModes": ["monthly", "annual", "biennial", "triennial"],
      "prices": {
        "en": {
          "monthly": 99,
          "annual": 950.40,
          "biennial": 1663.20,
          "triennial": 1782.00
        },
        "vi": {
          "monthly": 2400000,
          "annual": 23040000,
          "biennial": 40320000,
          "triennial": 43200000
        }
      },
      "trialDays": 30,
      "promo": { "enabled": true, "discountRate": 0.90, "durationMonths": 3 },
      "features": ["sandbox", "light-staging", "basic-observability"]
    },
    {
      "id": "infra-pilot",
      "name": { "en": "Infra Pilot", "vi": "Pilot Hạ tầng" },
      "tier": "core",
      "billingModes": ["monthly", "annual", "biennial", "triennial"],
      "setupPrice": { "en": { "min": 2500, "max": 4000 }, "vi": { "min": 35000000, "max": 70000000 } },
      "prices": {
        "en": {
          "monthly": 1500,
          "annual": 14400,
          "biennial": 25200,
          "triennial": 27000
        },
        "vi": {
          "monthly": 18500000,
          "annual": 177600000,
          "biennial": 310800000,
          "triennial": 333000000
        }
      },
      "trialDays": 30,
      "promo": { "enabled": true, "discountRate": 0.90, "durationMonths": 3 },
      "features": ["1-prod", "1-staging", "migration-plan", "backup-baseline"]
    },
    {
      "id": "infra-growth",
      "name": { "en": "Infra Growth", "vi": "Tăng trưởng Hạ tầng" },
      "tier": "growth",
      "billingModes": ["monthly", "annual", "biennial", "triennial"],
      "prices": {
        "en": {
          "monthly": 3500,
          "annual": 33600,
          "biennial": 58800,
          "triennial": 63000
        },
        "vi": {
          "monthly": 43500000,
          "annual": 417600000,
          "biennial": 730800000,
          "triennial": 783000000
        }
      },
      "trialDays": 30,
      "promo": { "enabled": true, "discountRate": 0.90, "durationMonths": 3 },
      "features": ["multi-project", "auth-bridge", "priority-support"]
    },
    {
      "id": "infra-enterprise",
      "name": { "en": "Infra Enterprise", "vi": "Hạ tầng Doanh nghiệp" },
      "tier": "enterprise",
      "billingModes": ["monthly", "annual"],
      "prices": {
        "en": { "monthly": 7500, "annual": 72000 },
        "vi": { "monthly": 95000000, "annual": 912000000 }
      },
      "trialDays": 30,
      "promo": { "enabled": true, "discountRate": 0.90, "durationMonths": 3 },
      "features": ["isolated", "custom-sso", "custom-approval", "dedicated-support"],
      "negotiable": true
    },
    {
      "id": "ai-agent-ops",
      "name": { "en": "AI Agent Ops Add-On", "vi": "Bổ sung AI Agent Ops" },
      "tier": "addon",
      "billingModes": ["monthly", "annual"],
      "prices": {
        "en": { "monthly": 1550, "annual": 14880 },
        "vi": { "monthly": 20000000, "annual": 192000000 }
      },
      "trialDays": 0,
      "promo": { "enabled": false },
      "features": ["agent-orchestration", "approval-automation", "audit-logs"]
    }
  ],
  "discounts": {
    "trial": { "days": 30, "scope": ["infra-explore", "infra-pilot", "infra-growth", "infra-enterprise"] },
    "promo": { "rate": 0.90, "durationMonths": 3, "scope": ["infra-explore", "infra-pilot", "infra-growth", "infra-enterprise"] },
    "prepay": {
      "annual": { "rate": 0.20, "label": "20% off" },
      "biennial": { "rate": 0.30, "label": "30% off" },
      "triennial": { "rate": 0.50, "label": "50% off" }
    }
  }
}
```

### 2.2 Schema Constraints
- `prices.*.monthly` is the base price (no discount)
- `prices.*.annual` = monthly × 12 × (1 - 0.20)
- `prices.*.biennial` = monthly × 24 × (1 - 0.30)
- `prices.*.triennial` = monthly × 36 × (1 - 0.50)
- `promo` applies only to `monthly` billing mode
- `setupPrice` is one-time, not affected by promo or prepay

---

## 3. Promo State Machine

### 3.1 States

```
[lead] --(start_trial)--> [trial]
[trial] --(trial_expires)--> [trial_expired]
[trial] --(convert_during_trial)--> [active_monthly]
[trial_expired] --(subscribe_monthly)--> [promo_1]
[promo_1] --(month_ends)--> [promo_2]
[promo_2] --(month_ends)--> [promo_3]
[promo_3] --(month_ends)--> [active_monthly]
[active_monthly] --(switch_annual)--> [active_annual]
[active_monthly] --(switch_biennial)--> [active_biennial]
[active_monthly] --(switch_triennial)--> [active_triennial]
[active_annual] --(cancel)--> [cancelled]
[active_monthly] --(cancel)--> [cancelled]
```

### 3.2 State Definitions

| State | Description | Billing |
|-------|-------------|---------|
| `lead` | Not yet started trial | None |
| `trial` | 30-day free trial | USD/VND 0 |
| `trial_expired` | Trial ended, not converted | None |
| `promo_1` | Month 1 after trial, 90% off | base × 0.10 |
| `promo_2` | Month 2 after trial, 90% off | base × 0.10 |
| `promo_3` | Month 3 after trial, 90% off | base × 0.10 |
| `active_monthly` | Regular monthly billing | base price |
| `active_annual` | Annual prepay, 20% off | base × 12 × 0.80 |
| `active_biennial` | 2-year prepay, 30% off | base × 24 × 0.70 |
| `active_triennial` | 3-year prepay, 50% off | base × 36 × 0.50 |
| `cancelled` | Subscription ended | None |

### 3.3 Transition Rules
- `trial` → `trial_expired`: auto after 30 days unless converted
- `trial` → `active_monthly`: monthly conversion during trial does not receive promo
- `trial_expired` → `promo_1`: only if user subscribes within 7 days of trial expiry (grace period) and the package has `promo.enabled = true`
- `promo_*` → next state: auto at month boundary
- Promo discount = 90% off = pay 10% of base monthly
- After `promo_3`, always go to `active_monthly` unless user switches to prepay
- Packages with `trialDays = 0` must not enter `trial`

---

## 4. Checkout Rules

### 4.1 Entity Routing

```typescript
type Market = "en" | "vi";
interface CheckoutContext {
  market: Market;
  packageId: string;
  billingMode: "monthly" | "annual" | "biennial" | "triennial";
  promoCode?: string;
}

function resolveCheckoutEntity(ctx: CheckoutContext): {
  entity: "us_entity" | "viet_can_new";
  currency: "USD" | "VND";
  language: "en" | "vi";
  stripeAccount?: string; // for Option A split
} {
  const market = getMarketConfig(ctx.market);
  return {
    entity: market.entity,
    currency: market.currency,
    language: market.language,
    stripeAccount: market.stripeAccountId, // null if using local invoice
  };
}
```

### 4.2 Hard Rules
1. **One checkout = one entity**: never mix US seller + VND price
2. **Currency locked**: checkout currency determined by market, not user choice
3. **Language locked**: checkout language = market language
4. **Promo locked**: promo applies only to monthly mode, not prepay
5. **Trial first**: all eligible packages must offer trial before purchase
6. **Entity disclosure**: must show legal entity name before payment capture

### 4.3 Invoice Metadata

```json
{
  "orderId": "ord_...",
  "language": "en",
  "currency": "USD",
  "market": "international",
  "contractEntity": "us_entity",
  "invoiceEntity": "us_entity",
  "pricingPlanId": "infra-pilot",
  "priceAmount": 1500,
  "priceVersion": "2026-06-06",
  "taxMode": "exclusive",
  "country": "US",
  "billingMode": "monthly",
  "promoApplied": false,
  "trialApplied": false,
  "discountAmount": 0
}
```

---

## 5. Analytics Events

### 5.1 Event Schema

```typescript
interface PricingEvent {
  event: string;
  timestamp: string;
  userId: string;
  anonymousId?: string;
  market: "en" | "vi";
  packageId: string;
  billingMode?: string;
  value?: number;
  currency?: "USD" | "VND";
  sessionId: string;
  referrer: string;
  browserLocale: string;
  chosenLocale: string;
}
```

### 5.2 Required Events

| Event | Trigger | Properties |
|-------|---------|------------|
| `pricing_page_viewed` | User lands on pricing | `market`, `packageIds[]` |
| `package_viewed` | User clicks/scrolls to package | `packageId`, `position` |
| `trial_started` | CTA "Start trial" | `packageId`, `market`, `source` |
| `trial_expired` | 30 days passed | `packageId`, `converted` |
| `promo_activated` | User enters promo phase | `packageId`, `promoMonth` |
| `checkout_initiated` | CTA "Subscribe" | `packageId`, `billingMode`, `market` |
| `checkout_completed` | Payment success | `packageId`, `billingMode`, `amount`, `currency` |
| `checkout_failed` | Payment declined | `packageId`, `billingMode`, `errorCode` |
| `plan_changed` | Upgrade/downgrade | `fromPackage`, `toPackage`, `fromBilling`, `toBilling` |
| `cancel_initiated` | User clicks cancel | `packageId`, `reason` |
| `cancel_completed` | Subscription ends | `packageId`, `finalState` |

---

## 6. CMS Fields

### 6.1 Package Content Model

```typescript
interface PackageCMS {
  id: string; // slug
  name_en: string;
  name_vi: string;
  description_en: string;
  description_vi: string;
  features_en: string[];
  features_vi: string[];
  notIncluded_en: string[];
  notIncluded_vi: string[];
  ctaText_en: string;
  ctaText_vi: string;
  salesPitch_en: string;
  salesPitch_vi: string;
  promoBadge_en: string; // e.g. "90% off first 3 months"
  promoBadge_vi: string; // e.g. "Giảm 90% 3 tháng đầu"
  isPublished: boolean;
  publishDate?: string;
}
```

### 6.2 Validation Rules
- `name_en` + `name_vi` required before publish
- `description_en` + `description_vi` required before publish
- `features_en` + `features_vi` must have ≥ 3 items
- `price` cannot be edited without version bump
- Changing price requires: new `priceVersion`, approval log, analytics event

---

## 7. Acceptance Criteria for QA

### 7.1 Pricing Display

```gherkin
Feature: Pricing page renders correctly per market

Scenario: Vietnamese visitor sees VND pricing
  Given browser locale is "vi-VN"
  When user visits "/pricing"
  Then page language is "vi"
  And currency is "VND"
  And prices match pricing.vi.json exactly
  And legal entity is "Viet Can New"

Scenario: International visitor sees USD pricing
  Given browser locale is "en-US"
  When user visits "/pricing"
  Then page language is "en"
  And currency is "USD"
  And prices match pricing.en.json exactly
  And legal entity is "omdala.com US entity"

Scenario: Manual language switch
  Given user is on "/pricing" with locale "en"
  When user clicks "Tiếng Việt"
  Then page switches to "vi" without page reload
  And prices update to VND table
  And choice is persisted in localStorage
```

### 7.2 Trial & Promo

```gherkin
Feature: Trial and promo flow

Scenario: Trial starts correctly
  Given user selects "Infra Explore"
  When user clicks "Start 30-day trial"
  Then trial record created with expiry = today + 30 days
  And user account state = "trial"
  And no payment method required

Scenario: Promo activates after trial
  Given user trial expires today
  And user subscribes to monthly within 7 days
  When first billing cycle starts
  Then invoice amount = base × 0.10
  And state = "promo_1"

Scenario: Promo does not apply to prepay
  Given user is in trial
  When user selects "Annual" billing
  Then checkout shows annual price = base × 12 × 0.80
  And promo is NOT applied
  And state skips promo, goes to "active_annual"

Scenario: Monthly returns to base after promo
  Given user completes promo_3
  When next billing cycle starts
  Then invoice amount = base price (no discount)
  And state = "active_monthly"
```

### 7.3 Checkout & Entity

```gherkin
Feature: Checkout entity routing

Scenario: EN checkout routes to US entity
  Given user is on "en" pricing page
  When user clicks "Subscribe" on any package
  Then checkout page shows "US entity" disclosure
  And currency is USD
  And Stripe account is US account

Scenario: VI checkout routes to Viet Can New
  Given user is on "vi" pricing page
  When user clicks "Subscribe"
  Then checkout page shows "Viet Can New" disclosure
  And currency is VND
  And payment method is local-compatible
```

### 7.4 Discount Engine

```gherkin
Feature: Discount calculation

Scenario: Annual discount
  Given base monthly = 100
  When user selects annual billing
  Then total = 100 × 12 × 0.80 = 960

Scenario: 3-year discount
  Given base monthly = 100
  When user selects triennial billing
  Then total = 100 × 36 × 0.50 = 1800

Scenario: No double discount
  Given user is in promo month 1
  When user tries to switch to annual
  Then annual prepay price applies (20% off)
  And promo 90% does NOT stack
```

### 7.5 Abuse Prevention

```gherkin
Feature: Promo abuse prevention

Scenario: One promo per account group
  Given user@company.com already redeemed promo
  When another user@company.com tries to start trial
  Then system allows trial
  But blocks promo redemption with error "Promo already used"

Scenario: Domain group restriction
  Given domain "company.com" has active promo
  When user from "sub.company.com" tries promo
  Then promo is blocked if account group matches
```

---

## 8. File Structure

```
packages/billing/
├── src/
│   ├── pricing-schema.json          # Canonical pricing config
│   ├── market-resolver.ts           # Browser locale → market
│   ├── price-calculator.ts          # Compute price with discounts
│   ├── promo-state-machine.ts       # Trial → Promo → Active logic
│   ├── checkout-router.ts           # Entity + currency routing
│   ├── discount-engine.ts           # Annual/biennial/triennial
│   ├── analytics-events.ts          # Event schema + emitters
│   └── index.ts                     # Public API
├── tests/
│   ├── price-calculator.test.ts
│   ├── promo-state-machine.test.ts
│   └── checkout-router.test.ts
└── package.json

apps/infra-web/
├── src/
│   ├── components/
│   │   ├── PricingPage.tsx          # Renders packages per market
│   │   ├── PackageCard.tsx          # Individual package display
│   │   ├── MarketSwitcher.tsx       # EN/VI toggle
│   │   └── EntityDisclosure.tsx     # Legal entity banner
│   └── lib/
│       ├── pricing-client.ts        # Fetch pricing from API
│       └── locale-persistence.ts    # Cookie + localStorage
```

---

## 9. API Endpoints

```
GET  /api/v1/pricing?market=en|vi
POST /api/v1/trial/start
POST /api/v1/subscribe
POST /api/v1/checkout/session
GET  /api/v1/orders/:orderId
POST /api/v1/analytics/event
```

---

## 10. Implementation Order

1. **Week 1**: Pricing schema + market resolver + price calculator
2. **Week 1**: Promo state machine + unit tests
3. **Week 2**: Checkout router + entity routing + Stripe integration
4. **Week 2**: Analytics events + CMS fields
5. **Week 3**: Pricing page UI + market switcher + entity disclosure
6. **Week 3**: QA acceptance criteria + E2E tests
7. **Week 4**: Staging deploy + founder approval + production release

---

## 11. Founder Lock Items (DO NOT CHANGE WITHOUT APPROVAL)

- [x] Discount ladder: 20% / 30% / 50%
- [x] Promo: 90% off for 3 months after trial
- [x] Trial: 30 days
- [x] Enterprise: eligible for promo if monthly
- [x] Two markets: EN/USD + VI/VND
- [x] Two entities: US + Viet Can New
- [ ] Final price values (pending approval)
- [ ] Stripe account split (Option A vs B)

---

**Status: SPEC APPROVED FOR IMPLEMENTATION**
