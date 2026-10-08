# G4 — Brand Factory Multi-Tenant Product Architecture

## Date: 2026-07-19

## G4.1 — Domain Model

### Entity Definitions

```
Tenant
  id: TEXT PRIMARY KEY
  type: TEXT (global | country_operator)
  name: TEXT
  created_at: INTEGER
  updated_at: INTEGER

Country
  id: TEXT PRIMARY KEY (ISO 3166-1 alpha-2, e.g., "VN")
  tenant_id: TEXT REFERENCES Tenant(id)
  name_en: TEXT
  name_local: TEXT
  locale: TEXT (e.g., "vi-VN")
  currency: TEXT (e.g., "VND")
  timezone: TEXT (e.g., "Asia/Ho_Chi_Minh")
  phone_code: TEXT (e.g., "+84")
  active: INTEGER (0 | 1)
  created_at: INTEGER

AdministrativeRegion
  id: TEXT PRIMARY KEY
  country_id: TEXT REFERENCES Country(id)
  parent_id: TEXT REFERENCES AdministrativeRegion(id) NULL
  level: INTEGER (1=province, 2=district, 3=ward)
  name_en: TEXT
  name_local: TEXT
  code: TEXT (e.g., "VN-SG")
  created_at: INTEGER

LocalNode
  id: TEXT PRIMARY KEY
  region_id: TEXT REFERENCES AdministrativeRegion(id)
  name: TEXT
  geo_lat: REAL
  geo_lng: REAL
  created_at: INTEGER

Place
  id: TEXT PRIMARY KEY
  local_node_id: TEXT REFERENCES LocalNode(id)
  brand_id: TEXT REFERENCES Brand(id)
  name: TEXT
  address_line1: TEXT
  address_line2: TEXT
  city: TEXT
  postal_code: TEXT
  country_id: TEXT REFERENCES Country(id)
  geo_lat: REAL
  geo_lng: REAL
  phone: TEXT
  website: TEXT
  hours_json: TEXT
  created_at: INTEGER
  updated_at: INTEGER

Brand
  id: TEXT PRIMARY KEY
  tenant_id: TEXT REFERENCES Tenant(id)
  country_id: TEXT REFERENCES Country(id)
  owner_id: TEXT REFERENCES Owner(id)
  name: TEXT
  slug: TEXT
  description: TEXT
  logo_url: TEXT
  status: TEXT (draft | pending | approved | suspended)
  created_at: INTEGER
  updated_at: INTEGER

Owner
  id: TEXT PRIMARY KEY
  user_id: TEXT (references Auth.js user)
  brand_id: TEXT REFERENCES Brand(id)
  role: TEXT (primary | manager | staff)
  verified: INTEGER (0 | 1)
  verified_at: INTEGER
  consent_id: TEXT REFERENCES Consent(id)
  created_at: INTEGER

Consent
  id: TEXT PRIMARY KEY
  owner_id: TEXT REFERENCES Owner(id)
  type: TEXT (data_usage | image_rights | marketing | ai_generation)
  granted: INTEGER (0 | 1)
  granted_at: INTEGER
  revoked_at: INTEGER NULL
  evidence_url: TEXT

Product
  id: TEXT PRIMARY KEY
  brand_id: TEXT REFERENCES Brand(id)
  place_id: TEXT REFERENCES Place(id) NULL
  name: TEXT
  slug: TEXT
  description: TEXT
  price_cents: INTEGER
  currency: TEXT
  status: TEXT (draft | active | archived)
  created_at: INTEGER

Experience
  id: TEXT PRIMARY KEY
  brand_id: TEXT REFERENCES Brand(id)
  name: TEXT
  slug: TEXT
  description: TEXT
  duration_minutes: INTEGER
  price_cents: INTEGER
  currency: TEXT
  status: TEXT
  created_at: INTEGER

ImageAsset
  id: TEXT PRIMARY KEY
  brand_id: TEXT REFERENCES Brand(id)
  place_id: TEXT REFERENCES Place(id) NULL
  r2_key: TEXT
  alt_text: TEXT
  provenance: TEXT (owner_submitted | ai_generated | stock)
  rights_status: TEXT (cleared | pending | denied)
  consent_id: TEXT REFERENCES Consent(id) NULL
  created_at: INTEGER

ComplianceProfile
  id: TEXT PRIMARY KEY
  country_id: TEXT REFERENCES Country(id)
  type: TEXT (gdpr | pdpa | data_localization)
  requirements_json: TEXT
  active: INTEGER

Inquiry
  id: TEXT PRIMARY KEY
  brand_id: TEXT REFERENCES Brand(id)
  place_id: TEXT REFERENCES Place(id) NULL
  product_id: TEXT REFERENCES Product(id) NULL
  experience_id: TEXT REFERENCES Experience(id) NULL
  customer_email: TEXT
  customer_name: TEXT
  message: TEXT
  status: TEXT (new | responded | closed)
  created_at: INTEGER

Site
  id: TEXT PRIMARY KEY
  brand_id: TEXT REFERENCES Brand(id)
  locale: TEXT
  theme_json: TEXT (local theme tokens)
  status: TEXT (draft | preview | published | unpublished)
  published_at: INTEGER
  unpublished_at: INTEGER

DomainBinding
  id: TEXT PRIMARY KEY
  site_id: TEXT REFERENCES Site(id)
  domain: TEXT
  verified: INTEGER (0 | 1)
  ssl_status: TEXT

Translation
  id: TEXT PRIMARY KEY
  entity_type: TEXT (brand | place | product | experience)
  entity_id: TEXT
  locale: TEXT
  field: TEXT
  value: TEXT
  created_at: INTEGER

AgentRun
  id: TEXT PRIMARY KEY
  tenant_id: TEXT
  agent_type: TEXT (intake | content | seo | schema | preview | qa)
  input_json: TEXT
  output_json: TEXT
  status: TEXT (pending | running | completed | failed)
  cost_cents: INTEGER
  started_at: INTEGER
  completed_at: INTEGER

Approval
  id: TEXT PRIMARY KEY
  agent_run_id: TEXT REFERENCES AgentRun(id)
  approver_id: TEXT (user_id)
  approved: INTEGER (0 | 1)
  notes: TEXT
  created_at: INTEGER

EvidenceLog
  id: TEXT PRIMARY KEY
  tenant_id: TEXT
  action: TEXT
  entity_type: TEXT
  entity_id: TEXT
  actor_id: TEXT
  before_json: TEXT
  after_json: TEXT
  created_at: INTEGER

Release
  id: TEXT PRIMARY KEY
  site_id: TEXT REFERENCES Site(id)
  version: INTEGER
  commit_sha: TEXT
  published_at: INTEGER
  rolled_back_at: INTEGER NULL
  rollback_reason: TEXT
```

---

## G4.2 — Vietnam Pilot Spec

### Country: Vietnam (VN)
- Locale: `vi-VN` + `en-US` (bilingual)
- Currency: VND
- Timezone: Asia/Ho_Chi_Minh
- Phone: +84
- Admin levels: Province (63) → District → Ward

### Pilot scope
- 1 city: Ho Chi Minh City
- 10-20 brands (restaurants, cafes, experiences)
- Bilingual content (Vietnamese + English)
- Owner self-service: claim brand, upload images, create products
- AI automation: intake, content generation, SEO, schema
- Human approval: all AI content before publish
- Custom domain support: `{brand}.omdala.vn` or custom domain

### Pilot success criteria
- 10 brands published with verified owners
- 100 products/experiences listed
- 50 inquiries processed
- Bilingual content 100% (VI + EN)
- AI automation 80%+ of content
- 0 unauthorized data access incidents

---

## G4.3 — Localization Contract

| Field | Vietnam | Thailand | Cambodia | Laos | Myanmar | Malaysia | Singapore | Indonesia | Philippines | Brunei |
|-------|---------|----------|----------|------|--------|----------|-----------|-----------|-------------|--------|
| ISO code | VN | TH | KH | LA | MM | MY | SG | ID | PH | BN |
| Locale | vi-VN | th-TH | km-KH | lo-LA | my-MM | ms-MY | en-SG | id-ID | fil-PH | ms-BN |
| Currency | VND | THB | KHR | LAK | MMK | MYR | SGD | IDR | PHP | BND |
| Timezone | Asia/Ho_Chi_Minh | Asia/Bangkok | Asia/Phnom_Penh | Asia/Vientiane | Asia/Yangon | Asia/Kuala_Lumpur | Asia/Singapore | Asia/Jakarta | Asia/Manila | Asia/Brunei |
| Phone | +84 | +66 | +855 | +856 | +95 | +60 | +65 | +62 | +63 | +673 |
| Address format | Number + Street, Ward, District, City | Number + Street, District, Province | Number + Street, Sangkat, Khan, City | Number + Street, Village, District, Province | Number + Street, Quarter, Township, City | Number + Street, Section, City, Postcode | Number + Street, Unit, Building, Postal | Number + Street, RT/RW, Kelurahan, City | Number + Street, Barangay, City, Province | Number + Street, Kampong, Mukim, District |

### Admin schema per country
- Each country has its own administrative division hierarchy
- Stored in `AdministrativeRegion` with `level` field
- Levels: 1=Province/State, 2=District/County, 3=Ward/Subdistrict

---

## G4.4 — Compliance Ownership

| Country | Data protection law | Compliance owner | Notes |
|---------|-------------------|-----------------|-------|
| Vietnam | Decree 13/2023/ND-CP | Country admin | Data localization requirements |
| Thailand | PDPA | Country admin | Consent management |
| Cambodia | Law on E-Commerce | Country admin | |
| Laos | Law on Electronic Data Protection | Country admin | |
| Myanmar | No specific law | Country admin | Follow GDPR best practices |
| Malaysia | PDPA 2010 | Country admin | |
| Singapore | PDPA 2012 | Country admin | |
| Indonesia | UU PDP 2022 | Country admin | Data localization for public sector |
| Philippines | Data Privacy Act 2012 | Country admin | |
| Brunei | PDPO 2022 | Country admin | |

### Compliance packs
- Each country has a `ComplianceProfile` with requirements
- AI generation requires explicit consent
- Image rights require owner verification
- No Google Maps-derived public claims without owner verification

---

## G4.5 — Brand Factory Renderer

### Principle: One renderer, local theme tokens

```
@omdala/renderer (shared package)
  ├── ThemeProvider (accepts theme tokens)
  ├── PageBuilder (renders from Site config)
  ├── ComponentLibrary (shared components)
  └── ThemeTokens (per-brand customization)
```

### Theme tokens per brand:
```json
{
  "colors": {
    "primary": "#...",
    "secondary": "#...",
    "accent": "#..."
  },
  "typography": {
    "headingFont": "...",
    "bodyFont": "..."
  },
  "spacing": { ... },
  "borderRadius": { ... }
}
```

### NO forked codebases
- All brands use the same renderer
- Customization via theme tokens + content
- No per-brand code branches

---

## G4.6 — AI Automation (80-90%)

| Agent | Task | Human approval? |
|-------|------|-----------------|
| Intake Agent | Collect brand info from owner, web, public data | No (intake only) |
| Content Agent | Generate brand descriptions, product copy, experience descriptions | YES (before publish) |
| SEO Agent | Generate meta tags, schema.org, sitemap | YES (before publish) |
| Schema Agent | Generate structured data (LocalBusiness, Product, etc.) | YES (before publish) |
| Preview Agent | Generate preview site | No (preview only) |
| QA Agent | Check content quality, bilingual completeness, accessibility | No (QA report only) |

### Approval workflow:
1. AI generates content → status `draft`
2. QA Agent reviews → status `pending_approval`
3. Human (owner/admin) reviews → status `approved` or `rejected`
4. Approved content → status `published` (via Release)

### Cost controls:
- Per-tenant AI budget (configurable)
- AgentRun records cost per execution
- Queue-based rate limiting
- Alert when budget at 80%

---

## G4.7 — 10-Country Backlog

### Ranking criteria:
1. Market size (population + tourism)
2. Operational proximity to Vietnam (pilot)
3. Legal/compliance complexity
4. Internet penetration
5. Mobile-first readiness

### Ranking:

| Rank | Country | Rationale |
|------|---------|-----------|
| 1 | Vietnam (VN) | Pilot country — founder's home market |
| 2 | Thailand (TH) | Large tourism market, close to VN, PDPA mature |
| 3 | Indonesia (ID) | Largest population in SEA, growing digital |
| 4 | Philippines (PH) | English-proficient, large BPO/tourism |
| 5 | Malaysia (MY) | Developed digital infrastructure, PDPA |
| 6 | Singapore (SG) | Smallest but highest GDP, tech hub |
| 7 | Cambodia (KH) | Close to VN, growing tourism |
| 8 | Laos (LA) | Close to VN, small but accessible |
| 9 | Myanmar (MM) | Uncertain regulatory environment |
| 10 | Brunei (BN) | Smallest market, low priority |

### Rollout plan:
- Phase 1: Vietnam pilot (G4.2)
- Phase 2: Thailand + Indonesia
- Phase 3: Philippines + Malaysia + Singapore
- Phase 4: Cambodia + Laos
- Phase 5: Myanmar + Brunei (subject to legal validation)

---

## G4 EXIT

| Task | Status |
|------|--------|
| G4.1 Domain model | PASS — 20 entities defined |
| G4.2 Vietnam pilot spec | PASS — scope, success criteria defined |
| G4.3 Localization contract | PASS — 10 countries mapped |
| G4.4 Compliance ownership | PASS — 10 countries mapped |
| G4.5 Brand Factory renderer | PASS — one renderer, theme tokens |
| G4.6 AI automation | PASS — 6 agents, approval workflow, cost controls |
| G4.7 10-country backlog | PASS — ranked, rollout plan defined |

**G4 Verdict: PASS** — Domain model, pilot spec, localization contract, compliance ownership all defined. Ready for G5 staging acceptance.
