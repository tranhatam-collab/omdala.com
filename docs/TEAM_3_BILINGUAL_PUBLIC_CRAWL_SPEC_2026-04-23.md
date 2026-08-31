# Team 3 Bilingual Public Crawl Spec

Date: April 23, 2026
Owner: Team 3 QA automation lead
Status: Active
Scope: public web bilingual crawl evidence for release gate

## 1. Crawl objective

Produce deterministic bilingual evidence for public routes and SEO-language correctness across `en` and `vi`.

## 2. URL inventory (mandatory)

Audit base routes:

- `/`
- `/what-is-omdala`
- `/how-it-works`
- `/for-experts`
- `/for-hosts`
- `/for-communities`
- `/trust`
- `/vision`
- `/faq`
- `/contact`

Audit localized route pairs:

- English: default route path (`/`, `/contact`, ...)
- Vietnamese: `/vi` prefixed equivalent (`/vi`, `/vi/contact`, ...)

Total expected URLs per run:

- 20 URLs (`10` pages x `2` languages)

## 3. Data extraction contract per URL

For each audited URL, collect:

- URL and language
- rendered `<html lang>`
- H1 count
- `<title>`
- `<meta name="description">`
- canonical URL
- hreflang map
- OG title and OG description
- schema payload summary (`name`, `description`)
- internal links inventory (language-preserving check)
- image inventory (`src`, `alt`)
- language-switch equivalence signal

## 4. Validation rules

### 4.1 Heading and metadata

- Exactly one `<h1>`
- Title non-empty
- Meta description non-empty
- Canonical exists and matches expected localized route
- Hreflang includes at least `en`, `vi`, and `x-default`
- OG title non-empty
- OG description non-empty

### 4.2 Schema

- At least one JSON-LD payload must expose non-empty `name`
- At least one JSON-LD payload must expose non-empty `description`

### 4.3 Internal links

- On `vi` pages, internal links must stay in `/vi/*` namespace
- On `en` pages, internal links must not unexpectedly jump into `/vi/*`

### 4.4 Images and alt text

- Every rendered public `<img>` must have non-empty `alt`
- Brand image alt (`/logo.svg`) must match language source intent

### 4.5 Language switch equivalence

- Route-equivalence rule:
  - EN `/path` <-> VI `/vi/path`
  - EN `/` <-> VI `/vi`
- Switcher implementation must use route-base + locale mapping, not hard-coded one-off routes

## 5. Crawl source modes

The crawler supports two data sources:

1. static export mode (`apps/web/out`) for deterministic local verification
2. URL mode (`BILINGUAL_AUDIT_BASE_URL`) for live/preview crawl

Default mode is static export.

## 6. Output artifacts

Machine-readable:

- `reports/bilingual/public-audit.<timestamp>.json`
- `reports/bilingual/public-audit.latest.json`

Human-readable summary:

- `reports/bilingual/public-audit.<timestamp>.md`
- `reports/bilingual/public-audit.latest.md`

Each run must include:

- total URLs reviewed
- pass/fail count
- issue count by code
- blocked URL list
- non-blocking warnings

## 7. Release-blocking policy

The crawl gate is release-blocking when any of these issue classes exist:

- missing metadata requirement
- missing image alt requirement
- language-switch equivalence mismatch

All other findings are warnings unless escalated by Team 3.
