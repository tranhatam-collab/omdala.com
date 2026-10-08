# infra.omdala.com — Packages, Demo, Comparison, and Promotion Strategy

## Date
- 2026-06-06

## Scope
- Commercial packaging and product explanation
- For founder review before implementation
- Applies to `infra.omdala.com` only
- No system change applied in this document

## Assumption Lock
- I interpret the promotion rule as:
  - month-to-month price stays at base price
  - 1-year prepay gets `20%` off
  - 2-year prepay gets `30%` off
  - 3-year prepay gets `50%` off
- If you intended a different ladder, team must not implement until founder corrects this line explicitly

## Core Pricing and Trial Policy

### Language and currency
- `en` market:
  - language `English`
  - currency `USD`
- `vi` market:
  - language `Tiếng Việt`
  - currency `VND`

### Trial and entry policy
- Free trial:
  - `30 days`
  - very limited capability
  - not equivalent to a paid month
- Post-trial retention promotion:
  - `90% off`
  - applies to the next `3 monthly billing cycles` after trial
  - applies only once per new account group
  - applies by default to all monthly plans, including `Enterprise`

### Prepay discounts
- `Monthly`: no discount
- `Annual`: `20% off`
- `2-year`: `30% off`
- `3-year`: `50% off`

## Commercial Product Structure

### Product line recommendation
I recommend splitting the offer into 5 commercial layers:

1. `Infra Explore`
2. `Infra Pilot`
3. `Infra Growth`
4. `Infra Enterprise`
5. `AI Agent Ops Add-On`

This structure is better than selling only 3 tiers because:
- it gives a very low-friction entry path
- it preserves a founder-led pilot sale
- it separates infrastructure from AI agent operations as an upsell

## Package Definitions

### 1. Infra Explore
- Purpose:
  - first contact
  - product evaluation
  - small proof-of-concept
  - lead capture
- Best for:
  - solo founders
  - small teams
  - early technical buyers
- Delivery model:
  - guided self-serve
  - light onboarding
  - no custom migration included

#### EN pricing
- Base monthly: `USD 99 / month`
- Trial: `30 days free`
- Promo months 1-3 after trial: `USD 9.90 / month`
- Annual effective: `USD 79.20 / month`, billed `USD 950.40 / year`
- 2-year effective: `USD 69.30 / month`, billed `USD 1,663.20 / 2 years`
- 3-year effective: `USD 49.50 / month`, billed `USD 1,782 / 3 years`

#### VI pricing
- Base monthly: `2,400,000 VND / month`
- Trial: `30 ngày miễn phí`
- Promo months 1-3 after trial: `240,000 VND / tháng`
- Annual effective: `1,920,000 VND / month`, billed `23,040,000 VND / year`
- 2-year effective: `1,680,000 VND / month`, billed `40,320,000 VND / 2 years`
- 3-year effective: `1,200,000 VND / month`, billed `43,200,000 VND / 3 years`

#### What is included
- 1 workspace / tenant
- 1 staging environment
- basic observability dashboard
- backup policy visibility
- standard support queue
- standard docs access

#### What is not included
- production cutover ownership
- custom auth migration
- custom SSO
- dedicated operator
- custom RPO/RTO commitment

### 2. Infra Pilot
- Purpose:
  - first real deployment lane
  - founder-led onboarding
  - controlled migration
  - first production-ready workload
- Best for:
  - startups with active product traffic
  - teams leaving Supabase/Render sprawl
  - teams that need private-core control

#### EN pricing
- Setup: `USD 2,500 - 4,000`
- Monthly: `USD 1,200 - 1,800`
- Trial: `30 days free`
- Promo months 1-3 after trial:
  - `USD 120 - 180 / month`
- Annual effective:
  - `USD 960 - 1,440 / month`
- 2-year effective:
  - `USD 840 - 1,260 / month`
- 3-year effective:
  - `USD 600 - 900 / month`

#### VI pricing
- Setup: `35,000,000 - 70,000,000 VND`
- Monthly: `15,000,000 - 22,000,000 VND`
- Trial: `30 ngày miễn phí`
- Promo months 1-3 after trial:
  - `1,500,000 - 2,200,000 VND / tháng`
- Annual effective:
  - `12,000,000 - 17,600,000 VND / month`
- 2-year effective:
  - `10,500,000 - 15,400,000 VND / month`
- 3-year effective:
  - `7,500,000 - 11,000,000 VND / month`

#### What is included
- 1 production environment
- 1 staging environment
- architecture fit review
- migration plan
- backup and restore baseline
- monitoring baseline
- founder-review handoff
- limited cutover support

### 3. Infra Growth
- Purpose:
  - multi-project operations
  - stronger reliability
  - shared platform for several internal products
- Best for:
  - agencies
  - AI product groups
  - multi-site operators
  - internal platform teams

#### EN pricing
- Monthly: `USD 2,500 - 4,500`
- Trial: `30 days free`
- Promo months 1-3 after trial:
  - `USD 250 - 450 / month`
- Annual effective:
  - `USD 2,000 - 3,600 / month`
- 2-year effective:
  - `USD 1,750 - 3,150 / month`
- 3-year effective:
  - `USD 1,250 - 2,250 / month`

#### VI pricing
- Monthly: `32,000,000 - 55,000,000 VND`
- Trial: `30 ngày miễn phí`
- Promo months 1-3 after trial:
  - `3,200,000 - 5,500,000 VND / tháng`
- Annual effective:
  - `25,600,000 - 44,000,000 VND / month`
- 2-year effective:
  - `22,400,000 - 38,500,000 VND / month`
- 3-year effective:
  - `16,000,000 - 27,500,000 VND / month`

#### What is included
- multiple projects
- production and staging governance
- auth bridge support
- worker operations
- higher usage thresholds
- priority support lane
- migration assistance

### 4. Infra Enterprise
- Purpose:
  - isolated private control plane
  - custom governance
  - contract-heavy deployments
- Best for:
  - enterprise clients
  - regulated workloads
  - organizations needing custom access control and reporting

#### EN pricing
- Monthly: `USD 7,500+`
- Trial: `30 days free`
- Promo months 1-3 after trial:
  - `USD 750+ / month`
- Annual:
  - negotiable, but target `20%` only if prepay risk is acceptable

#### VI pricing
- Monthly: `95,000,000 VND+`
- Trial: `30 ngày miễn phí`
- Promo months 1-3 after trial:
  - `9,500,000 VND+ / tháng`
- Annual:
  - negotiated case by case

#### What is included
- isolated environment
- dedicated onboarding
- custom auth / SSO
- custom approval workflows
- reporting pack
- higher-touch operational support

### 5. AI Agent Ops Add-On
- Purpose:
  - add agent automation on top of infra operations
- Why this should exist:
  - it increases ACV
  - it separates plain infra buyers from AI-ops buyers
  - it lets you sell governance-first automation without forcing every infra customer to buy it

#### EN pricing
- Add-on: `USD 600 - 2,500 / month`

#### VI pricing
- Add-on: `8,000,000 - 32,000,000 VND / month`

#### What is included
- agent task orchestration
- approval-gated automation
- audit logs and evidence logs
- assisted deploy/review/report actions
- usage reporting for AI operations

## 30-Day Free Trial Definition

### Trial name
- EN: `Infra Explore Trial`
- VI: `Dùng thử Hạ tầng Cơ bản`

### Trial duration
- `30 days`

### Trial access should include
- sandbox workspace
- documentation access
- architecture explorer
- sample dashboard
- limited health and usage visibility
- sample backup policy view
- lead capture and onboarding request

### Trial access should not include
- no real production deployment
- no custom domain cutover
- no real secret migration
- no real database migration
- no dedicated support SLA
- no private-core production resources
- no enterprise auth bridge
- no agent destructive actions

### Trial intent
- Trial is for product understanding, not free managed infra
- Team must keep trial useful enough to convert, but restricted enough to protect operations margin

## 90 Percent Three-Month Promotion Rules

### Why this is good
- It is stronger than a short first-month discount
- It preserves perceived value
- It reduces buyer hesitation
- It gives a longer retention window after trial
- It increases the chance of habit formation and migration momentum

### Where to apply
- `Infra Explore`
- `Infra Pilot`
- `Infra Growth`
- `Infra Enterprise`

### Where not to apply
- custom migration packages
- manual consulting or emergency services

### Abuse prevention
- one company group only
- one domain group only
- one billing identity only
- one legal entity set only
- one promo redemption per verified account group

## Demo Strategy

### Demo type 1 — Interactive product demo
- Show:
  - dashboard
  - health
  - backup visibility
  - market/language/currency switching
  - approval flow overview
- Goal:
  - convert cold leads into pilot calls

### Demo type 2 — Architecture walkthrough
- Show:
  - Cloudflare edge
  - private PostgreSQL core
  - backup and restore flow
  - auth bridge
  - monitoring
- Goal:
  - reassure technical buyers

### Demo type 3 — Migration scenario demo
- Show:
  - Supabase / D1 / Render current-state map
  - target-state infra design
  - cutover sequence
  - rollback story
- Goal:
  - convert high-intent migration prospects

### Demo type 4 — AI Agent Ops demo
- Show:
  - task routing
  - approval gate
  - audit evidence
  - report generation
- Goal:
  - upsell AI Agent Ops Add-On

## Package Comparison

| Package | Best for | Setup | Environments | Migration | AI Agent Ops | Support | Promo eligible |
|---|---|---:|---|---|---|---|---|
| Infra Explore | Early evaluation | No | Sandbox / light staging | No | No | Standard | Yes |
| Infra Pilot | First real deployment | Yes | 1 prod + 1 staging | Basic | Optional add-on | Guided | Yes |
| Infra Growth | Multi-project teams | Optional | Multi-env | Yes | Optional add-on | Priority | Yes |
| Infra Enterprise | Regulated / large org | Yes | Isolated custom | Yes | Optional or bundled | High-touch | Yes |
| AI Agent Ops Add-On | Infra automation buyers | No | Works with base package | N/A | Yes | Depends on base tier | N/A |

## Recommended Website Copy Direction

### Hero promise
- EN:
  - private-core infrastructure for AI teams that need control, auditability, and clean migration paths
- VI:
  - hạ tầng lõi riêng cho đội ngũ AI cần kiểm soát, khả năng kiểm toán và lộ trình chuyển đổi rõ ràng

### Pricing page rule
- Show all packages with:
  - monthly price
  - trial duration
  - promo price for months 1-3 after trial
  - annual price
  - multi-year price
  - who it is for
  - what is included
  - what is intentionally not included

### Sales CTA examples
- EN:
  - `Start 30-day trial`
  - `Unlock 90 percent off for 3 months`
  - `Request pilot quote`
  - `Book migration review`
- VI:
  - `Bắt đầu dùng thử 30 ngày`
  - `Mở khóa ưu đãi 90 phần trăm trong 3 tháng`
  - `Yêu cầu báo giá pilot`
  - `Đặt lịch rà soát migration`

## Technology Description for Marketing and Sales

### What to describe clearly
- Cloudflare-first edge architecture
- private-core PostgreSQL strategy
- backup and restore discipline
- approval-gated infrastructure changes
- multi-tenant backend governance
- optional AI Agent assistance for operations

### What not to oversell yet
- fully autonomous production operations
- zero-risk migration
- enterprise compliance claims beyond current evidence
- fully self-serve instant setup

## Should There Be Another Package

### Recommendation
- Yes: add `AI Agent Ops Add-On`

### Reason
- It cleanly monetizes the AI automation layer
- It avoids bloating the base infra plans
- It creates a stronger enterprise upsell
- It lets you message:
  - base infra for control
  - agent ops for leverage

### Optional future package
- `Infra Advisory`
- This would be a consulting-first, no-hosting package
- Use only if you get demand from teams not ready to migrate yet

## Dev Team Implementation Requirements

### Pricing registry
- Must store:
  - base monthly
  - trial duration
  - promo duration in months
  - promo monthly price
  - annual effective rate
  - 2-year effective rate
  - 3-year effective rate
  - promo eligibility flags

### Trial engine
- Must store:
  - trial start date
  - trial expiry
  - trial capability set
  - conversion path
  - promo start date
  - promo expiry after trial

### Promo engine
- Must support:
  - 30-day free trial
  - 90% off for the next 3 monthly billing cycles
  - recurring annual, 2-year, 3-year discounts
  - exclusion rules

### Package comparison UI
- Must render:
  - EN and VI tables separately from content registry
  - market-aware CTA
  - legal entity disclosure for each checkout path

### Demo content
- Must support:
  - demo page
  - architecture explainer
  - migration scenario section
  - AI Agent Ops explainer section

## Founder Approval Checklist

- [ ] Confirm discount ladder: 20 / 30 / 50
- [ ] Confirm 90% promo for 3 post-trial months
- [ ] Confirm 30-day trial scope
- [ ] Approve `Infra Explore` package
- [ ] Approve `AI Agent Ops Add-On`
- [ ] Approve which tiers can receive promo
- [ ] Approve monthly, annual, 2-year, 3-year price tables
- [ ] Approve EN and VI CTA language
- [ ] Approve sales demo structure

## Final Recommendation
- Keep the existing 4 core packages
- Add `Infra Explore` as the low-friction entry tier
- Add `AI Agent Ops Add-On` as the upsell layer
- Use `30-day basic trial` plus `90% off for the next 3 monthly billing cycles`
- Keep trial scope clearly weaker than paid monthly
- Keep annual and multi-year discounts visible on pricing page
- Do not implement until founder locks the exact discount ladder and package matrix

## Status
- Strategy complete
- Ready for founder review
- Not yet approved for implementation
