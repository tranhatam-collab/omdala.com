# infra.omdala.com — USD/VND Market and Implementation Strategy

## Date
- 2026-06-06

## Scope
- Strategy only
- No system change applied
- Applies to `infra.omdala.com` only
- Audience:
  - Founder
  - Product
  - Legal
  - Billing
  - Dev team

## Decision Lock
- International product language: `English`
- International pricing currency: `USD`
- Vietnam product language: `Tiếng Việt`
- Vietnam pricing currency: `VND`
- Default language at first visit: based on browser language
- If browser language starts with `vi`, default to `vi-VN`
- All other browsers default to `en`
- This is a market-based pricing model, not live FX conversion

## Business Entity Strategy

### Primary global entity
- `omdala.com` is positioned as the US company and the primary international contracting entity
- Default international invoices, contracts, subscriptions, and pricing pages use:
  - English
  - USD
  - US entity disclosure

### Vietnam market entity
- Vietnam-facing commercial execution is handled through:
  - `Công ty Cổ phần Giáo dục Truyền Việt Can New`
- Vietnam market uses:
  - Vietnamese copy
  - VND pricing
  - Vietnam billing/contact/legal disclosure where applicable

### Operating rule
- The product surface must never leave buyers uncertain about:
  - which legal entity they are buying from
  - which currency they are paying in
  - which support channel owns the contract

## Commercial Positioning

### Product category
`infra.omdala.com` should be sold as:
- sovereign AI backend platform
- Cloudflare-first edge plus private-core infrastructure
- managed migration and operations platform
- approval-gated infrastructure for AI teams and multi-project organizations

### Not to position as
- generic VPS hosting
- cheap developer hosting
- self-serve infra marketplace
- instant one-click enterprise platform

## Market Segmentation

### Segment A — International
- Language: English
- Currency: USD
- Entity: US company
- Buyer profile:
  - startup founders
  - AI product teams
  - agencies managing multiple apps
  - teams migrating off fragmented stacks

### Segment B — Vietnam
- Language: Vietnamese
- Currency: VND
- Entity handling local commercial representation: Viet Can New
- Buyer profile:
  - SMEs
  - education/media organizations
  - AI service operators
  - founder-led product teams needing managed infrastructure

## Pricing Model

### Pricing rule
- Do not auto-convert prices from USD to VND on the fly
- Maintain two approved pricing tables:
  - `en` table in USD
  - `vi` table in VND
- The VND table should be localized for the Vietnam market, not a strict exchange-rate mirror
- Trial rule:
  - `30 days` free trial
  - `3 monthly billing cycles after trial` get `90% off`
- Promo eligibility:
  - applies by default to all monthly market packages, including `Enterprise`, unless founder explicitly disables it for a contract case

## Recommended Product Packages

### 1. Infra Pilot Setup
- Purpose:
  - architecture review
  - migration map
  - tenant setup
  - backup and monitoring baseline
  - first environment deployment

#### EN / International
- `USD 2,500 - 4,000` one-time

#### VI / Vietnam
- `35,000,000 - 70,000,000 VND` one-time

### 2. Managed Pilot Monthly
- Purpose:
  - 1 production tenant
  - 1 staging environment
  - monitoring
  - backup operations
  - patch lane
  - limited support window

#### EN / International
- `USD 1,200 - 1,800 / month`

#### VI / Vietnam
- `15,000,000 - 22,000,000 VND / month`

### 3. Growth Plan
- Purpose:
  - multi-project support
  - auth bridge
  - worker operations
  - quota and cost visibility
  - migration support
  - stronger operational response

#### EN / International
- `USD 2,500 - 4,500 / month`

#### VI / Vietnam
- `32,000,000 - 55,000,000 VND / month`

### 4. Enterprise Private Control Plane
- Purpose:
  - isolated deployment
  - custom auth and SSO
  - stronger governance
  - custom approval flows
  - higher-touch support and reporting

#### EN / International
- `USD 7,500+ / month`

#### VI / Vietnam
- `95,000,000 VND+ / month`

### 5. Migration Add-On
- Purpose:
  - Supabase to sovereign PostgreSQL
  - D1 inventory and migration
  - Render/Workers cutover
  - rollback playbook

#### EN / International
- `USD 2,000 - 10,000`

#### VI / Vietnam
- `25,000,000 - 120,000,000 VND`

## Pricing Logic

### Why this pricing works
- Raw infrastructure cost is not the value anchor
- The real value is:
  - architecture consolidation
  - migration risk reduction
  - control over secrets and data
  - backup and restore discipline
  - approval-gated operations
  - reduced vendor sprawl

### Why two pricing tables are correct
- International buyers compare against:
  - Supabase
  - Auth0
  - n8n
  - Railway
  - Render
  - managed cloud operators
- Vietnam buyers compare against:
  - local service agencies
  - managed ops retainers
  - implementation projects, not pure SaaS line items

### Pricing references used
- Supabase Pro starts from `$25/month`
- Auth0 Essentials starts from `$35/month`
- n8n pricing shows hosted plans and self-hosted business packaging
- Stripe supports multi-currency presentment and invoicing patterns
- Cloudflare usage pricing remains low enough that OMDALA should price by managed value, not raw edge cost

## Language and Currency UX Rules

### Default detection
- Browser locale starts the session
- Mapping:
  - `vi*` -> `vi-VN`, `VND`
  - everything else -> `en-US`, `USD`

### Manual override
- User can manually switch language
- User can manually switch market if allowed by policy
- Persist both in:
  - cookie
  - local storage
  - account profile if logged in

### Copy rules
- `en` is the international source of commercial packaging
- `vi` is a localized commercial table for Vietnam
- The two price tables can be intentionally different
- Team must never render:
  - English copy with VND by accident
  - Vietnamese copy with USD by accident
  - the wrong legal entity disclosure for the selected market

## Legal and Contract Display Rules

### EN / USD flow
- Show:
  - English TOS
  - English pricing
  - USD checkout
  - US entity as contracting party

### VI / VND flow
- Show:
  - Vietnamese commercial page
  - VND pricing
  - Vietnam-facing invoice/contact flow when local contract path is chosen
  - Viet Can New disclosure where required

### Hard rule
- One checkout must have one merchant identity only
- Do not mix:
  - US seller name
  - VND price
  - Vietnam invoice wording
  - in one ambiguous flow unless legal and finance explicitly approve that model

## Recommended Commercial Routing

### Option A — Cleanest model
- International:
  - US entity
  - USD
  - Stripe
- Vietnam:
  - Viet Can New local commercial handling
  - VND
  - local invoice/payment process or a Vietnam-compatible gateway

### Option B — Single payment rail, dual presentation
- Use Stripe as core billing system
- English products priced in USD
- Vietnamese products priced in VND if supported in billing flow
- Legal entity and invoicing still must be explicit per product/checkout path

### Recommended founder choice
- Start with `Option A`
- It is cleaner operationally and legally
- It reduces entity confusion during early pilots

## Implementation Strategy for Dev Team

### Team 1 — Product and Pricing Registry
- Deliver:
  - canonical pricing config
  - market segmentation config
  - package matrix
- Required files:
  - `infra/content/pricing.en.json`
  - `infra/content/pricing.vi.json`
  - `infra/content/market-routing.json`
  - `infra/content/legal-disclosure.en.json`
  - `infra/content/legal-disclosure.vi.json`
- Rules:
  - no public pricing hard-coded in components
  - no runtime FX conversion for pricing pages

### Team 2 — Frontend Language and Market Detection
- Deliver:
  - browser language detection
  - locale persistence
  - market switcher
  - currency formatting
- Rules:
  - first load chooses browser locale
  - if `vi`, show VND table
  - otherwise show English and USD
  - allow founder to force default market via env flag if needed

### Team 3 — Checkout and Entity Routing
- Deliver:
  - checkout entry points split by market
  - invoice metadata
  - legal entity disclosure block
- Rules:
  - `en` package routes to international checkout
  - `vi` package routes to Vietnam checkout/contact flow
  - every order record stores:
    - selected language
    - selected currency
    - market
    - legal entity
    - tax/invoice mode

### Team 4 — CMS and Content Governance
- Deliver:
  - bilingual package copy
  - use-case pages
  - case-study page slots
  - FAQ by market
- Rules:
  - `en` and `vi` are separate controlled fields
  - no publish if one required market page is incomplete

### Team 5 — Analytics and RevOps
- Deliver:
  - lead source tracking
  - package click tracking
  - market split dashboard
  - pricing page conversion events
- Track:
  - browser locale
  - chosen locale
  - chosen market
  - package viewed
  - checkout started
  - sales-call request

## Billing Data Model Requirements

### Required fields
- `language`
- `currency`
- `market`
- `contract_entity`
- `invoice_entity`
- `pricing_plan_id`
- `price_amount`
- `price_version`
- `tax_mode`
- `country`

### Required enums
- `language`: `en`, `vi`
- `currency`: `USD`, `VND`
- `market`: `international`, `vietnam`
- `contract_entity`: `us_entity`, `viet_can_new`

## Website Rules for infra.omdala.com

### Public site
- Default English for non-vi browsers
- Show international narrative first
- Vietnamese visitors should land on Vietnamese content and VND table

### Sales CTA
- EN:
  - `Book infrastructure review`
  - `Request pilot quote`
  - `Talk to solution team`
- VI:
  - `Đặt lịch tư vấn hạ tầng`
  - `Yêu cầu báo giá pilot`
  - `Trao đổi với đội triển khai`

## What Must Exist Before Public Launch

### Commercial assets
- English pricing page
- Vietnamese pricing page
- package comparison
- legal entity disclosure blocks
- quote request form
- pilot scope template
- migration intake form

### Technical assets
- locale resolver
- market resolver
- pricing registry
- currency formatter
- checkout router
- CRM event capture

### Operational assets
- who sells international
- who sells Vietnam
- who issues invoice
- who owns support handoff
- who approves discounts

## Discount Policy

### Allowed
- pilot discount
- nonprofit/education discount
- founder-approved annual prepay discount

### Forbidden
- ad hoc manual price promises outside approved tables
- silent FX-based pricing drift
- dev team changing displayed price without pricing version update

## Founder Approval Checklist

- [ ] Lock the two-entity commercial model
- [ ] Lock the two-table pricing model
- [ ] Approve package names
- [ ] Approve USD prices
- [ ] Approve VND prices
- [ ] Approve checkout routing model
- [ ] Approve legal disclosure copy
- [ ] Approve sales CTA and quote flow

## Final Recommendation

- Keep `infra.omdala.com` as a managed infrastructure product, not a cheap hosting offer
- Use `English + USD` for international
- Use `Vietnamese + VND` for Vietnam
- Implement market-based price tables, not live currency conversion
- Keep entity disclosure explicit and separate in every commercial flow
- Let dev start only after founder locks:
  - package matrix
  - price table
  - entity-routing model
  - checkout-routing model

## Implementation Status
- Strategy complete
- No code or system behavior changed in this turn
- Ready for founder review and dev handoff
