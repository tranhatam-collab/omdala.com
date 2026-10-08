# OMDALA APP.OMDALA.COM — RUNTIME WORKSPACE SPEC 2026-06-30

Status: GLOBAL-FIRST — LOCKED FOR PHASE 1
Scope: authenticated runtime workspace for the OMDALA.com global brand ecosystem
Owner: Tran Ha Tam (Founder)

---

## 1. Official Definition

**English:**

> `app.omdala.com` is the authenticated runtime workspace for OMDALA users, operators, sellers, buyers, partners, and administrators to manage real-world digital assets, commitments, proofs, transfers, and trust.

**Tiếng Việt:**

> `app.omdala.com` là không gian vận hành có đăng nhập của OMDALA, nơi người dùng, người bán, người mua, operator, partner và admin quản lý tài sản thương hiệu, cam kết, bằng chứng, giao dịch chuyển nhượng và độ tin cậy.

---

## 2. Positioning in the OMDALA Ecosystem

| Domain | Role |
|--------|------|
| `omdala.com` | Master brand / global positioning / thought layer |
| `brand.omdala.com` | Global Brand Exchange — showroom, listings, SEO, inquiry/offer |
| `app.omdala.com` | **Runtime Workspace — authenticated user action, deal execution, proof vault, transfer tracking** |
| `docs.omdala.com` | Documentation, guides, policies |
| `trust.omdala.com` | Trust / proof / verification API layer |
| `infra.omdala.com` | Technical infrastructure operations |
| `api.omdala.com` | Global API gateway |
| `auth.omdala.com` | Global identity |
| `OMDALAT.com` | Local/city node (separate) |

Core thesis:

> `brand.omdala.com` sells the verified brand assets. `app.omdala.com` operates the verified brand assets.

---

## 3. app.omdala.com is NOT

- Landing page
- Public marketing site
- Marketplace public surface
- Blog
- Docs
- OMDALAT local app
- Decorative dashboard
- Demo shell
- Place of promises without real runtime

---

## 4. app.omdala.com IS

- Workspace
- Control center
- Deal room
- Proof vault
- Trust dashboard
- Transfer tracker
- Operator console
- AI-assisted action space

---

## 5. User Roles & Workflows

### 5.1 User

- Create OMDALA account
- Verify profile
- View owned assets
- Watch brands
- Send inquiries / offers
- Enter deal rooms
- Receive notifications
- Upload proof when needed

### 5.2 Seller

- Create seller profile
- Declare brand assets
- Upload ownership proof
- Create listing drafts
- Track review status
- Receive inquiries/offers
- Complete transfers
- Manage delivery checklist
- Track listing revenue

### 5.3 Buyer

- Create buyer profile
- Save watchlist
- Send inquiries
- Submit offers
- View verification status
- Enter deal rooms
- Track transfers
- Confirm asset receipt
- Open disputes if needed

### 5.4 Operator

- Review listing queue
- Verify proofs
- Add risk flags
- Request additional documents
- Approve/reject listings
- Monitor deal rooms
- Handle transfers
- Prepare release evidence

### 5.5 Admin / Founder

- View entire portfolio
- Approve premium listings
- View runtime truth
- View revenue
- View risk dashboard
- Control legal gates
- Control release readiness
- Approve launch / no-launch

---

## 6. 12 Core Modules

| # | Module | Purpose |
|---|--------|---------|
| 1 | Command Center | First screen after login; shows what to do next |
| 2 | Identity & Profile | User, org, role, KYC/KYB |
| 3 | Brand Portfolio | My brands, watched, submitted, purchased, sold, archived |
| 4 | Brand Asset Editor | Create/update brand declaration with included/excluded assets |
| 5 | Proof Vault | Upload, review, and manage all proof records |
| 6 | Listings | Draft, submit, review, list, pause, sell |
| 7 | Deal Room | Structured buyer/seller negotiation with audit trail |
| 8 | Transfer Workspace | Step-by-step asset transfer checklist |
| 9 | Trust Dashboard | Trust levels for seller, buyer, asset, proof, transfer |
| 10 | Notifications / Inbox | Actionable alerts and reminders |
| 11 | AI Assistant / Action Panel | Guided suggestions, risk detection, next-action prompts |
| 12 | Admin / Operator Console | Review, approval, risk, dispute, release readiness |

---

## 7. Module Details

### 7.1 Command Center

Displays:

- Account status
- Owned assets
- Listings under review
- New offers
- Transfers in progress
- Missing proofs
- Risk flags
- Next best actions
- AI suggestions

Goal: user knows immediately what to do next.

### 7.2 Identity & Profile

Status levels:

- `unverified`
- `email_verified`
- `identity_verified`
- `organization_verified`
- `seller_approved`
- `buyer_approved`
- `premium_buyer`
- `operator`

### 7.3 Brand Portfolio

Sections:

- My Brands
- Watched Brands
- Submitted Brands
- Purchased Brands
- Sold Brands
- Archived Brands

Each brand card shows:

- Brand ID
- Name
- Category
- Status
- Verification level
- Proof level
- Transfer status
- Strategic estimate
- Risk flags

### 7.4 Brand Asset Editor

Required fields:

- Brand name
- Domain
- Description
- Industry
- Market
- Languages
- Included assets
- Excluded assets
- Trademark status
- Website/app status
- Revenue status
- Traffic status
- Social handles
- Asking price
- Sale type
- Transfer conditions

Rule: no public listing if included/excluded assets are unclear.

### 7.5 Proof Vault

Proof types:

- Domain
- Trademark
- Source code
- Design files
- Social handles
- Revenue
- Traffic
- Contracts
- Identity/KYC
- Transfer

Each proof record:

- Proof type
- Owner
- Uploaded date
- Verification status
- Reviewer
- Expiry date
- Visibility (private/public)
- Hash/checksum
- Audit trail

Status:

- `missing`
- `uploaded`
- `pending_review`
- `verified`
- `rejected`
- `expired`
- `requires_legal_review`

### 7.6 Listings

Status:

- `draft`
- `submitted`
- `under_review`
- `changes_requested`
- `approved`
- `listed`
- `paused`
- `under_offer`
- `sold`
- `rejected`
- `archived`

Public listing shows:

- Asset summary
- Verification badges
- Strategic estimate
- Currency
- Buyer requirements
- Legal notes
- Transfer complexity
- Risk status

### 7.7 Deal Room

Contains:

- Inquiry thread
- Offer / counter-offer
- Documents
- Questions & answers
- Operator notes
- Legal checklist
- Transfer checklist
- Activity log

Goal: all negotiation has an audit trail.

### 7.8 Transfer Workspace

Checklists by asset type:

| Asset Type | Transfer Steps |
|------------|----------------|
| Domain | Unlock, confirm registrar, get auth code, transfer/push, buyer confirms |
| Trademark | Draft assignment, sign, file jurisdiction, recordal status, legal confirmation |
| Website/App | Source handover, hosting transfer, env cleanup, deployment access transfer, buyer confirms build access |
| Design/Content | Source files delivered, license/assignment confirmed, media rights confirmed |
| Social | Admin access transferred, platform policy warning accepted, buyer confirms control |
| Revenue/Traffic | Read-only analytics proof, revenue export, customer data rules acknowledged |

### 7.9 Trust Dashboard

Shows trust for:

- Seller
- Buyer
- Brand asset
- Proof package
- Transfer process
- Operator decision

Trust display:

- Trust level
- Reason
- Proof count
- Verified actions
- Disputes
- Warning flags
- Trust history

Example:

```
Seller Trust: High
Reason: 7 verified assets, 2 completed transfers, no disputes
Risk: Trademark assignment pending
```

### 7.10 Notifications / Inbox

Notifies about:

- Proof required
- Review result
- Offer received
- Offer accepted
- Transfer step due
- Dispute opened
- Policy update
- Payment/legal reminder

### 7.11 AI Assistant / Action Panel

AI is a guide, not a decision maker:

- Guide seller to complete listing
- Detect missing proof
- Warn risky claims
- Suggest listing descriptions
- Check SEO
- Summarize buyer inquiries
- Recommend next actions
- Support operator review

AI must NOT:

- Approve legal
- Confirm ownership
- Commit valuation
- Release transactions
- Replace legal counsel

Sample AI suggestion:

```
Suggestion:
Your listing is missing domain ownership proof.
Why: A brand cannot be listed publicly without proof that the seller controls the domain.
Action: [Add DNS TXT Proof] [Upload Registrar Screenshot]
```

### 7.12 Admin / Operator Console

May live at `app.omdala.com/admin` or be linked to `admin.omdala.com`.

Includes:

- Review queue
- Proof review
- Listing approval
- Seller verification
- Buyer verification
- Risk flags
- Dispute center
- Transfer monitor
- Legal review queue
- Release readiness
- Runtime truth
- Audit logs

---

## 8. Dashboards

### 8.1 Seller Dashboard

- Total brands
- Active listings
- Pending review
- Offers received
- Missing proof
- Transfers in progress
- Revenue/fees
- Risk flags

CTA: Create Brand Asset, Add Proof, Submit Listing, Respond to Offer

### 8.2 Buyer Dashboard

- Saved brands
- Active inquiries
- Offers sent
- Transfers in progress
- Requested documents
- Accepted deals
- Watched categories

CTA: Search Brands, Make Offer, Continue Transfer, Request More Proof

### 8.3 Operator Dashboard

- Pending listing reviews
- Proof reviews
- High-risk assets
- Disputes
- Transfer blockers
- Legal review needed
- Release blockers

CTA: Review Listing, Verify Proof, Add Risk Flag, Request Documents, Escalate

### 8.4 Founder Dashboard

- Total portfolio value estimate
- Private inventory
- Live listings
- Pending high-value deals
- Risk summary
- Legal blockers
- Revenue summary
- Runtime truth status
- Release evidence

CTA: Approve Premium Listing, Freeze Listing, Approve Launch, Review Risk, Export Report

---

## 9. Runtime Truth Screen

A dedicated screen in `app.omdala.com` called **Runtime Truth**.

Displays per feature:

| Feature | Status | Evidence | Owner | Next Step |
|---------|--------|----------|-------|-------------|
| Brand Registry | Running Local | Test log | AI Dev | Deploy staging |
| Listing Review | Spec Only | Doc link | AI Dev | Build API |
| Proof Vault | Partial | Upload route | AI Dev | Add encryption |

Standard status:

- `NOT_STARTED`
- `SPEC_ONLY`
- `MOCK`
- `PARTIAL`
- `RUNNING_LOCAL`
- `RUNNING_STAGING`
- `PRODUCTION_VERIFIED`

No production claim without evidence.

---

## 10. Information Architecture

```
app.omdala.com
├── /login
├── /signup
├── /onboarding
├── /dashboard
├── /profile
├── /organization
├── /brands
│   ├── /new
│   ├── /[brandId]
│   ├── /[brandId]/edit
│   ├── /[brandId]/proofs
│   ├── /[brandId]/listing
│   └── /[brandId]/transfer
├── /listings
│   ├── /drafts
│   ├── /active
│   ├── /sold
│   └── /review
├── /deals
│   └── /[dealId]
├── /offers
├── /proof-vault
├── /transfers
│   └── /[transferId]
├── /trust
├── /inbox
├── /ai
├── /runtime-truth
├── /billing
├── /settings
└── /admin
    ├── /review-queue
    ├── /proofs
    ├── /risk-flags
    ├── /disputes
    ├── /transfers
    ├── /legal-review
    └── /release
```

---

## 11. Phase 1 Build Scope

### 11.1 Build in Phase 1

- Login / signup
- Onboarding
- Dashboard
- Brand portfolio
- Brand asset editor
- Basic proof vault
- Listing draft
- Listing review status
- Inquiry / manual offer
- Basic deal room
- Admin review queue
- Runtime truth screen
- EN / VI interface

### 11.2 Do NOT Build in Phase 1

- Public seller upload
- Auction
- Escrow fund custody
- AI valuation
- NFT minting
- Automated trademark transfer
- Public API
- Advanced AI automation
- OMDALAT local workspace

---

## 12. Core Data Objects

- User
- Organization
- Role
- BrandAsset
- BrandPackage
- DomainAsset
- TrademarkAsset
- DigitalAsset
- SocialHandle
- ProofRecord
- VerificationRecord
- Listing
- Inquiry
- Offer
- DealRoom
- Transfer
- TransferStep
- TrustRecord
- RiskFlag
- AuditEvent
- Notification
- RuntimeTruthRecord

---

## 13. Primary User Flows

### 13.1 Seller Flow

Sign up → Verify email → Complete profile → Create brand asset → Declare included/excluded assets → Upload proof → Create listing draft → Submit for review → Receive approval/change request → Listing approved → Receive inquiry/offer → Enter deal room → Complete transfer checklist → Close deal

### 13.2 Buyer Flow

Browse `brand.omdala.com` → Save brand → Open `app.omdala.com` account → Send inquiry → Submit offer → Enter deal room → Review proof package → Accept transfer terms → Confirm received assets → Close deal

### 13.3 Operator Flow

Login → Open review queue → Review brand declaration → Review proofs → Add risk flags → Request changes or approve → Monitor deal room → Verify transfer steps → Prepare release evidence

---

## 14. UI Principles

**Calm Power Interface.**

Every screen must answer:

1. Where am I?
2. What is the current status?
3. What is missing?
4. What is the next action?
5. Where is the risk?
6. Where is the evidence?

---

## 15. Relationship to brand.omdala.com

| brand.omdala.com | app.omdala.com |
|------------------|----------------|
| Showroom + SEO | Workspace + proof vault |
| Public listing display | Authenticated operations |
| Inquiry CTA | Deal room execution |
| Asset discovery | Asset management |
| Verified badge display | Verification workflow |
| Marketplace public | Private inventory / admin review |
| Marketing surface | Trust and transfer system |

---

## 16. Global-First Rules

- English is primary interface language.
- Vietnamese is secondary for founder governance.
- USD is default currency.
- VND is used for Vietnam market contexts.
- No local brands in Phase 1.
- OMDALAT.com is the local node, not part of this plan.

---

## 17. Security & Compliance

- All authenticated routes require `auth.omdala.com`.
- Proof files use signed URLs only.
- Every admin action writes audit log.
- High-value assets (>= USD 5,000) require manual review.
- KYC/KYB for seller/buyer approval.
- Data retention per `OMDALA_BRAND_OWNERSHIP_PROOF_WORKFLOW_2026-06-30.md`.

---

## 18. References

- `OMDALA_GLOBAL_BRAND_ECOSYSTEM_MASTER_PLAN_2026-06-30.md`
- `OMDALA_GLOBAL_BRAND_PORTFOLIO_REGISTRY_2026-06-30.md`
- `OMDALA_BRAND_EXCHANGE_PRIVATE_INVENTORY_PLAN_2026-06-30.md`
- `OMDALA_BRAND_PACKAGE_STANDARD_2026-06-30.md`
- `OMDALA_BRAND_OWNERSHIP_PROOF_WORKFLOW_2026-06-30.md`
- `OMDALA_BRAND_VALUATION_FRAMEWORK_2026-06-30.md`
- `OMDALA_BRAND_EXCHANGE_LEGAL_INDEX_2026-06-30.md`
- `OMDALA_RUNTIME_TRUTH_STATUS_2026-06-30.md`

---

## 19. Lock Sentence

> `app.omdala.com` is where the OMDALA ecosystem becomes real.
