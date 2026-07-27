# OMDALA BRAND.OMDALA.COM — EXCHANGE SURFACE SPEC 2026-06-30

Status: GLOBAL-FIRST — LOCKED FOR PHASE 1
Scope: public marketplace surface and SEO engine for the OMDALA Global Brand Exchange
Owner: Tran Ha Tam (Founder)

---

## 1. Official Definition

**English:**

> `brand.omdala.com` sells the verified brand assets.

**Tiếng Việt:**

> `brand.omdala.com` là nơi niêm yết, giới thiệu, định giá, nhận inquiry/offer và bán các tài sản thương hiệu đã được xác minh.

---

## 2. Positioning in the OMDALA Ecosystem

| Domain | Role |
|--------|------|
| `omdala.com` | Master brand / global positioning / thought layer |
| `brand.omdala.com` | **Global Brand Exchange — showroom, listings, SEO, inquiry/offer** |
| `app.omdala.com` | Runtime workspace — authenticated deal execution, proof vault, transfer |
| `docs.omdala.com` | Documentation, guides, policies |
| `trust.omdala.com` | Trust / proof / verification API layer |
| `OMDALAT.com` | Local/city node (separate) |

Core thesis:

> `brand.omdala.com` sells the verified brand assets. `app.omdala.com` operates the verified brand assets.

---

## 3. brand.omdala.com is NOT

- Place to upload sensitive documents
- KYC/KYB processing center
- Direct payment handler
- Automated legal ownership confirmer
- Public proof file gallery
- Final AI valuation authority
- NFT legal ownership marketplace
- Local OMDALAT posting surface
- Workspace or deal execution surface

---

## 4. brand.omdala.com IS

- Showroom
- Marketplace
- Trust display
- SEO engine
- Inquiry/offer conversion surface
- Public route to `app.omdala.com`

---

## 5. Core Purpose

1. **Show** — display brand assets.
2. **Explain** — clarify what is included and excluded.
3. **Verify** — display verification level.
4. **Convert** — generate inquiries and offers.
5. **Route** — bring buyers and sellers into `app.omdala.com` for real transactions.

---

## 6. Information Architecture

```
brand.omdala.com
├── /
├── /en
├── /vi
├── /en/buy
├── /en/sell
├── /en/brands
├── /en/brands/[slug]
├── /en/categories
├── /en/categories/ai
├── /en/categories/saas
├── /en/categories/education
├── /en/categories/infrastructure
├── /en/verified-assets
├── /en/private-inventory
├── /en/how-it-works
├── /en/valuation
├── /en/verification
├── /en/legal
├── /en/faq
└── /vi/...
```

Phase 1 uses path-based routing. Subdomains like `auction.brand.omdala.com` are deferred.

---

## 7. Brand Package as the Listing Unit

A listing on `brand.omdala.com` is not a name — it is a **Brand Package**.

A Brand Package may include:

- Brand name
- Domain
- Logo
- Design system
- Website
- App
- Codebase
- Content
- SEO assets
- Documentation
- Social handles
- Trademark status
- Ownership proof
- Traffic/revenue proof
- Transfer checklist
- Risk notes
- Valuation estimate

Every listing must declare **Included** and **Excluded** assets.

Example:

```
Included:
- domain
- website source
- brand kit
- logo files
- SEO content

Excluded:
- registered trademark
- social handles
- customer database
- revenue account
```

---

## 8. Listing Tiers

| Tier | Name | Description | Phase 1 |
|------|------|-------------|---------|
| T1 | Concept Brand | Idea-stage brand with package; domain or landing page | Possible |
| T2 | Digital Brand Package | Domain, website, app shell, brand kit, content | Primary for Phase 1 |
| T3 | Operating Brand | Adds traffic, users, revenue, customer proof | Possible |
| T4 | Verified IP Brand | Adds trademark/IP or legal record; requires legal review | Manual |
| T5 | Premium Strategic Brand | High-value brand; requires founder approval, buyer qualification, legal counsel, escrow | Manual / not Phase 1 |

---

## 9. Brand Detail Page Structure

Example: `brand.omdala.com/en/brands/omcode`

### 9.1 Hero

- Brand name
- One-line positioning
- Category
- Asking price / inquiry-only
- Verification level
- CTA: Request Access, Make Inquiry, Open Deal Room

### 9.2 Brand Summary

- What the brand is
- Who it serves
- Which market
- Why it is valuable

### 9.3 Included Assets Table

| Asset | Included | Verification |
|-------|----------|--------------|
| Domain | Yes | Domain verified |
| Logo | Yes | Source files available |
| Website | Yes | Repo available |
| App | Yes/No | Build status |
| Trademark | No/Pending/Yes | Legal review required |
| Social handles | Optional | Manual proof |

### 9.4 Verification Status

- Domain verified
- Codebase verified
- Design files verified
- Trademark claimed / not claimed / verified
- Revenue claimed / not verified
- Traffic claimed / verified
- Seller identity verified

### 9.5 Proof Summary

Do not display sensitive documents publicly. Show summary only.

Example:

```
Proof Package:
- Domain control: verified
- Source repository: verified
- Design source files: uploaded
- Trademark: not included
- Revenue: not claimed
```

### 9.6 Valuation Estimate

Display format:

```
Estimated Range: USD 10,000 – 50,000
Confidence: Medium
Drivers: domain, codebase, product concept, global market
Risks: no revenue proof, no registered trademark
```

Label: **Strategic estimate, not market appraisal.**

### 9.7 Transfer Conditions

Example:

```
Transfer includes:
- domain transfer
- source code delivery
- brand kit handover
- deployment documentation

Transfer does not include:
- trademark assignment
- existing revenue account
- social media accounts
```

### 9.8 Buyer Actions

- Request More Information
- Make Inquiry
- Submit Offer
- Request Proof Access
- Open Deal Room

No `Buy Now` for assets >= USD 5,000.

---

## 10. Listing Status

- `Draft`
- `Pending Review`
- `Approved`
- `Listed`
- `Inquiry Open`
- `Under Offer`
- `Transfer Pending`
- `Transferred`
- `Paused`
- `Rejected`
- `Archived`

Public statuses only:

- `Listed`
- `Inquiry Open`
- `Under Offer` (price may be hidden)

Not public:

- `Draft`
- `Pending Review`
- `Rejected`
- `Proof Missing`

---

## 11. Verification Badges

Allowed badges:

- Domain Verified
- Codebase Verified
- Design Files Available
- Trademark Not Included
- Revenue Not Verified
- Seller Verified
- Legal Review Required
- High-Value Manual Deal

Forbidden badges:

- Fully Verified
- Guaranteed Ownership
- Risk-Free
- Legal-Safe Worldwide
- Guaranteed ROI
- NFT-Owned Brand

---

## 12. Buyer Journey

1. Browse `brand.omdala.com`
2. Find brand
3. View detail page
4. See verification status
5. See included/excluded assets
6. Send inquiry
7. Create account on `app.omdala.com`
8. Enter deal room
9. View proof/private docs if approved
10. Submit offer
11. Transfer workflow

Phase 1: no automated checkout for high-value assets.

---

## 13. Seller Journey

Phase 1: no public seller self-upload.

Future seller flow:

1. Visit `brand.omdala.com/sell`
2. Read conditions
3. Create account
4. Enter `app.omdala.com`
5. Create brand asset
6. Upload proof
7. Submit listing
8. Admin review
9. If approved, listing appears on `brand.omdala.com`

Key point: `brand.omdala.com` only displays approved listings. Draft, proof, KYC, and review live in `app.omdala.com`.

---

## 14. SEO Strategy

### 14.1 Global English Keywords

- buy AI brand
- sell digital brand
- verified brand assets
- brand asset marketplace
- SaaS brand for sale
- domain and brand package
- brand acquisition marketplace
- brand transfer checklist
- trademark vs domain ownership
- how to buy a brand safely

### 14.2 SEO Pages

- `/en/buy-a-brand`
- `/en/sell-a-brand`
- `/en/verified-brand-assets`
- `/en/ai-brands-for-sale`
- `/en/saas-brands-for-sale`
- `/en/infrastructure-brands-for-sale`
- `/en/brand-transfer-guide`
- `/en/domain-transfer-guide`
- `/en/trademark-assignment-guide`
- `/en/nft-certificate-vs-legal-ownership`

### 14.3 Vietnamese Secondary Pages

- `/vi/mua-ban-thuong-hieu`
- `/vi/ban-thuong-hieu-so`
- `/vi/tai-san-thuong-hieu`
- `/vi/chuyen-nhuong-ten-mien-va-thuong-hieu`

---

## 15. First Listings

Phase 1 uses only private OMDALA inventory.

Initial listing candidates:

1. OMCODE
2. Om AI
3. AI Omniverse
4. OMDALA Trust
5. OMDALA Infra
6. OMDALA API
7. OMDALA Auth
8. OMDALA Billing
9. OMDALA Matching
10. OMDALA Vault
11. OMONE — only after external repo sync and verification

Note: `OMDALA.com` is not listed. It is the master brand.

---

## 16. Sales Copy Formula

No hype. Sell by:

- Clarity
- Proof
- Asset packaging
- Transfer readiness
- Global potential
- Buyer confidence

Standard English copy:

> This brand package is designed for founders, operators, and buyers who want a verified digital brand asset with clear included assets, documented transfer conditions, and an OMDALA-managed proof workflow.

Standard Vietnamese copy:

> Gói thương hiệu này dành cho founder, operator và buyer muốn sở hữu một tài sản thương hiệu số có hồ sơ rõ ràng, tài sản đi kèm minh bạch, điều kiện chuyển nhượng cụ thể và quy trình bằng chứng được quản lý trong hệ OMDALA.

---

## 17. Phase 1 Minimum Build

- Homepage
- Buy page
- Sell page
- Brand listing index
- Brand detail page
- Verification explanation
- Legal center
- Inquiry CTA
- Admin-approved private inventory
- English / Vietnamese
- SEO metadata
- Structured data
- No checkout
- No auction
- No seller self-upload

---

## 18. Global-First Rules

- English is primary public language.
- Vietnamese is secondary for governance.
- USD is default currency.
- No local brands in Phase 1.
- OMDALAT.com is the local node, not part of this plan.

---

## 19. References

- `OMDALA_GLOBAL_BRAND_ECOSYSTEM_MASTER_PLAN_2026-06-30.md`
- `OMDALA_GLOBAL_BRAND_PORTFOLIO_REGISTRY_2026-06-30.md`
- `OMDALA_BRAND_EXCHANGE_PRIVATE_INVENTORY_PLAN_2026-06-30.md`
- `OMDALA_BRAND_PACKAGE_STANDARD_2026-06-30.md`
- `OMDALA_BRAND_VALUATION_FRAMEWORK_2026-06-30.md`
- `OMDALA_BRAND_OWNERSHIP_PROOF_WORKFLOW_2026-06-30.md`
- `OMDALA_APP_OMDALA_RUNTIME_WORKSPACE_SPEC_2026-06-30.md`
- `OMDALA_BRAND_EXCHANGE_SEO_ROADMAP_2026-06-30.md`

---

## 20. Lock Sentence

> `brand.omdala.com` is the global commercial front of the OMDALA Brand Exchange.
