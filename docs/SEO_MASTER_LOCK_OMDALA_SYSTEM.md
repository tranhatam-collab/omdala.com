# SEO_MASTER_LOCK_OMDALA_SYSTEM.md

## OMDALA.COM
## Master SEO Lock File
## Global SEO + Subdomain Architecture Lock
## Version 1.0

---

## 1. PURPOSE

This document locks the SEO architecture for the entire OMDALA ecosystem from day one.

It exists to ensure:
- one canonical SEO strategy
- one subdomain logic
- one crawl and index discipline
- one metadata discipline
- one multilingual discipline
- one internal linking architecture
- one entity-building strategy
- zero avoidable SEO debt during scale

This file is binding for:
- founder
- product
- design
- frontend
- backend
- AI content systems
- content team
- ops team

No subdomain, route family, metadata system, robots rule, sitemap rule, or schema layer should be built outside this document unless explicitly approved.

---

## 2. WHAT OMDALA IS IN SEARCH TERMS

OMDALA is not:
- a generic AI startup site
- a simple SaaS homepage
- a random marketplace
- a tourism network
- a content blog only

OMDALA is:
- the master global brand
- the global operating layer
- the coordination and trust system
- the root entity for all future OMDALA subdomains
- the parent domain from which all ecosystem meaning flows

Therefore SEO for OMDALA must do three things at once:
1. Build OMDALA as a strong global entity
2. Create a technically clean subdomain system
3. Support future expansion without architecture collapse

---

## 3. ROOT SEO POSITIONING

### 3.1 Core Search Positioning

OMDALA should rank and be understood as:
- a global operating system for real-world value
- a trust and coordination platform
- a system for people, places, communities, resources, and action
- the parent layer behind city implementations such as OMDALAT

### 3.2 Main Search Intent Buckets

- brand searches
- product and platform searches
- trust and coordination searches
- ecosystem and infrastructure searches
- docs and developer searches
- app entry searches
- city-node implementation searches
- people / places / host / expert / community discovery under subdomains

---

## 4. MASTER DOMAIN STRATEGY

### 4.1 Primary Root Domain

```
https://omdala.com
```

This is the apex root and global source-of-truth brand domain.

### 4.2 Primary Canonical Host

Preferred canonical host: `https://omdala.com`

Rules:
- force HTTPS
- force non-www
- redirect `http://` → `https://`
- redirect `www.omdala.com` → `omdala.com`

---

## 5. SUBDOMAIN SYSTEM ARCHITECTURE

All major OMDALA products and layers live under purpose-specific subdomains.

### 5.1 Approved Core Subdomains

#### omdala.com

Role: global homepage, masterbrand, system definition, global entity page, strategic entry point

Indexable: **yes**

#### app.omdala.com

Role: main user application — dashboard, nodes, resources, offers, requests, matches, trust, bookings, AI

Indexable: **no** for authenticated/internal app routes; **limited yes** only for selected public-marketing or public object pages if intentionally exposed

#### api.omdala.com

Role: backend API

Indexable: **no**

#### docs.omdala.com

Role: developer documentation, API docs, system specs, product docs, AI docs, trust docs

Indexable: **yes** for public doc pages; **no** for internal preview or private docs

#### admin.omdala.com

Role: internal operations — moderation, support, verification, analytics

Indexable: **no**

#### omdalat.com

Role: first city implementation, local proof layer, city-node experience

Indexable: **yes**

#### app.omdalat.com

Role: localized city experience — city-filtered interface, live place/host/community activity layer

Indexable: **mixed** — public useful pages may be indexable; authenticated/private states noindex

#### status.omdala.com

Role: system status page

Indexable: **yes**, low priority

#### trust.omdala.com

Role: trust framework, verification explanation, trust model, security and trust system pages

Indexable: **yes**

---

## 6. EXPANSION SUBDOMAIN FRAMEWORK

The ecosystem is intended to scale broadly.

### 6.1 Product Subdomains

Use when a product is clearly distinct.

Examples:
```
app.omdala.com
trust.omdala.com
docs.omdala.com
status.omdala.com
```

### 6.2 City Node Subdomains

Use for future localized implementations if strategically needed.

```
omdalat.com
```

Rule: City implementations should use dedicated domains or clear brand-safe structures. Do not create random city subdomains too early.

### 6.3 Functional Subdomains

Use sparingly with strong system meaning only.

Possible future:
```
partners.omdala.com
support.omdala.com
labs.omdala.com
flow.omdala.com
```

Rule: Every new subdomain must have a unique SEO role, a unique crawl/index policy, a unique page purpose, and a clear relationship to the masterbrand.

---

## 7. SUBDOMAIN MAP — FULL LOCK

```
omdala.com              → Global masterbrand homepage
app.omdala.com          → Main application
api.omdala.com          → API layer (no index)
docs.omdala.com         → Public documentation
admin.omdala.com        → Internal admin (no index)
trust.omdala.com        → Trust and verification public layer
status.omdala.com       → Public system status

omdalat.com             → First city-node implementation
app.omdalat.com         → Local app / city activity layer

--- Optional future ---
partners.omdala.com     → Partnerships and institutional entry
support.omdala.com      → Help center
labs.omdala.com         → R&D / experiments
flow.omdala.com         → Workflow / orchestration layer
```

---

## 8. DNS + CLOUDFLARE RULES

### 8.1 DNS Strategy

Use explicit DNS records for all important production subdomains.

Do not assume wildcard routing is sufficient for core production surfaces.

### 8.2 Wildcard Rule

Wildcard DNS can be used for broad preview patterns, but core branded production subdomains must always be explicitly planned and controlled.

### 8.3 Worker / App Routing Rule

When Cloudflare Workers Custom Domains are used: each important subdomain must be configured explicitly. Cloudflare Workers Custom Domains do not support wildcard custom domain matching. Declare each subdomain from day one.

### 8.4 Per-Subdomain Configuration Lock

For every approved production subdomain, lock:
- DNS record
- canonical host
- environment mapping
- robots/index policy
- analytics policy
- security headers
- deployment target

---

## 9. ROOT URL ARCHITECTURE — omdala.com

### 9.1 Approved Public Routes

```
/
/what-is-omdala
/how-it-works
/for-experts
/for-hosts
/for-communities
/trust
/omdalat
/docs
/vision
/faq
/contact
```

Optional future:
```
/platform
/products
/developers
/partners
/security
/manifesto
```

### 9.2 URL Rules

- lowercase only
- hyphens only, no underscores
- no random numeric public URLs
- no temporary slug patterns
- no query-parameter indexed marketing pages
- no duplicate `v2/final/new` routes

---

## 10. INDEXABILITY RULES BY SUBDOMAIN

### 10.1 omdala.com

Indexable: **yes**

Purpose: brand entity, global platform explanation, system architecture, gateway to ecosystem

robots.txt:
```
User-agent: *
Allow: /

Disallow: /api/
Disallow: /admin/
Disallow: /internal/
Disallow: /preview/

Sitemap: https://omdala.com/sitemap.xml
```

### 10.2 docs.omdala.com

Indexable: **yes** for public docs; **noindex** for preview, draft, internal-only

Purpose: developer discovery, technical SEO, documentation footprint, product and API reference

robots.txt:
```
User-agent: *
Allow: /

Disallow: /preview/
Disallow: /internal/
Disallow: /draft/

Sitemap: https://docs.omdala.com/sitemap.xml
```

### 10.3 app.omdala.com

Indexable: **no** by default

robots.txt:
```
User-agent: *
Disallow: /
```

Exception: if specific public-facing marketing pages are hosted at `app.omdala.com`, those specific paths may be selectively allowed.

### 10.4 api.omdala.com

Indexable: **no**

robots.txt:
```
User-agent: *
Disallow: /
```

### 10.5 admin.omdala.com

Indexable: **no**

robots.txt:
```
User-agent: *
Disallow: /
```

Must also be protected via Cloudflare Zero Trust Access — SEO blocking alone is not sufficient.

### 10.6 trust.omdala.com

Indexable: **yes**

Purpose: entity trust signaling, verification explanation, public trust framework

robots.txt:
```
User-agent: *
Allow: /

Sitemap: https://trust.omdala.com/sitemap.xml
```

### 10.7 status.omdala.com

Indexable: **yes**, low priority

No sitemap required.

### 10.8 omdalat.com

Indexable: **yes**

Purpose: city-node proof, local entity, OMDALA-in-reality demonstration

robots.txt:
```
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /internal/

Sitemap: https://omdalat.com/sitemap.xml
```

---

## 11. METADATA SYSTEM

### 11.1 Required Tags per Page

Every indexable page must have:
- `<title>` — unique, descriptive, brand-suffixed
- `<meta name="description">` — unique, 140–160 characters
- `<link rel="canonical">` — exact canonical URL
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
- Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

### 11.2 Title Formula

```
[Page Topic] — OMDALA
```

Examples:
```
OMDALA — The Operating Layer for Real-World Value
How It Works — OMDALA
Trust Framework — OMDALA
```

For docs:
```
[Doc Title] | OMDALA Docs
```

### 11.3 Canonical Tag Rule

- Every page must declare its canonical URL explicitly.
- Do not rely on framework default canonical logic without verification.
- Canonical must be the exact preferred URL: HTTPS, non-www, no trailing slash inconsistency.

### 11.4 noindex Rule

Apply `<meta name="robots" content="noindex, nofollow">` to:
- all preview/staging environments
- all authenticated routes
- all empty or thin content pages
- all internal/admin routes
- any page not yet ready for search

---

## 12. STRUCTURED DATA STRATEGY

### 12.1 Required Schema Types

| Page | Schema Type |
|------|-------------|
| Homepage | `Organization`, `WebSite` |
| All pages | `BreadcrumbList` |
| Docs pages | `TechArticle` or `Article` |
| Trust pages | `WebPage` |
| City node (omdalat.com) | `Organization`, `Place` (extended) |

### 12.2 Organization Schema — omdala.com

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "OMDALA",
  "url": "https://omdala.com",
  "logo": "https://omdala.com/logo.png",
  "description": "The global operating layer for real-world value, trust, and intelligent coordination.",
  "sameAs": []
}
```

### 12.3 WebSite Schema — omdala.com

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "OMDALA",
  "url": "https://omdala.com"
}
```

### 12.4 Structured Data Rules

- Implement schema via JSON-LD only (not microdata or RDFa).
- Inject via `<script type="application/ld+json">` in `<head>`.
- Create reusable helpers: `getOrganizationSchema()`, `getWebSiteSchema()`, `getBreadcrumbSchema()`.
- Never duplicate conflicting schema types on the same page.

---

## 13. SITEMAP STRATEGY

### 13.1 omdala.com

```
/sitemap.xml         → sitemap index
/sitemap-pages.xml   → public route pages
/sitemap-docs.xml    → docs reference (if hosted here)
```

### 13.2 Sitemap Rules

- Include only indexable, canonical, live URLs.
- Do not include noindex pages, authenticated pages, or preview pages.
- Include `<lastmod>`, `<changefreq>`, `<priority>` fields.
- Regenerate sitemap automatically on content publish.
- Submit sitemap to Google Search Console on day one.

### 13.3 Priority Guidelines

| Route | Priority |
|-------|----------|
| `/` | 1.0 |
| `/what-is-omdala`, `/how-it-works` | 0.9 |
| `/for-experts`, `/for-hosts`, `/for-communities` | 0.8 |
| `/trust`, `/vision` | 0.7 |
| `/faq`, `/contact` | 0.6 |

---

## 14. MULTILINGUAL ARCHITECTURE

### 14.1 Supported Languages (Phase 1)

```
en   — English (primary)
vi   — Vietnamese (OMDALAT first-market priority)
```

### 14.2 URL Strategy

Preferred: subdirectory approach for same domain

```
omdala.com/          → English (x-default)
omdala.com/vi/       → Vietnamese
```

Alternative for distinct city layers:
```
omdalat.com/         → Vietnamese (primary)
omdalat.com/en/      → English
```

### 14.3 hreflang Tags

Every multilingual page must include:

```html
<link rel="alternate" hreflang="en" href="https://omdala.com/..." />
<link rel="alternate" hreflang="vi" href="https://omdala.com/vi/..." />
<link rel="alternate" hreflang="x-default" href="https://omdala.com/..." />
```

### 14.4 Multilingual Rules

- Never use URL parameters for language (`?lang=vi` is forbidden).
- Never duplicate content across language versions without hreflang.
- Do not machine-translate content without human review for brand-critical pages.

---

## 15. INTERNAL LINKING STRATEGY

### 15.1 Principles

- All internal links must render as `<a href="...">` in HTML.
- Do not use JavaScript-only navigation for primary page links.
- Every major page must receive at least one internal link from a related page.
- Cross-subdomain links must use absolute URLs.

### 15.2 Required Cross-Links

```
omdala.com/omdalat    → links to omdalat.com
omdalat.com           → links back to omdala.com
docs.omdala.com       → links back to omdala.com
trust.omdala.com      → links back to omdala.com
```

### 15.3 Anchor Text Rules

- Use descriptive, semantic anchor text.
- Never use "click here" or "read more" as anchor text.
- Anchor text should reflect the destination page topic.

---

## 16. TECHNICAL RENDERING REQUIREMENTS

### 16.1 SSR / SSG First Rule

All indexable public pages must deliver meaningful HTML content in the server-side rendered output.

Do not rely on client-side JavaScript rendering for content that must be indexed.

Preferred rendering strategy:
- Static pages: SSG (Static Site Generation)
- Dynamic public pages: SSR (Server-Side Rendering)
- App/dashboard routes: CSR (Client-Side Rendering) is acceptable — these are noindex anyway

### 16.2 Core Web Vitals Baseline

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID / INP | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

### 16.3 Performance Rules

- HTML must render fast without blocking on JavaScript.
- Split bundles — do not load all JS on landing pages.
- Lazy-load non-critical components.
- Optimize and size all images at build time.
- Use `next/image` or equivalent for image optimization.

---

## 17. ENTITY-BUILDING STRATEGY

### 17.1 What Is Entity SEO

Google understands the web as a graph of entities — organizations, places, concepts, people.

OMDALA must establish itself as a recognized, consistent entity in Google's Knowledge Graph.

### 17.2 Entity Signals to Build

- Consistent `Organization` schema on every page of omdala.com
- Consistent NAP (Name, Address, Phone) if applicable
- Consistent brand name across all subdomains
- Social profile links inside schema `sameAs`
- Internal cross-linking that reinforces entity relationships
- Descriptive, consistent meta descriptions across all pages

### 17.3 Authority Signals

- Submit to Google Search Console for all primary domains
- Submit sitemaps immediately upon launch
- Ensure Google can crawl all public pages from day one
- Do not launch publicly indexable pages with thin or empty content

---

## 18. SEARCH CONSOLE SETUP

Register and verify all primary indexable domains:

```
omdala.com
docs.omdala.com
trust.omdala.com
omdalat.com
```

Actions after verification:
1. Submit sitemap for each domain
2. Request indexing for key pages
3. Monitor crawl errors weekly
4. Monitor Core Web Vitals weekly

---

## 19. ANTI-PATTERN RULES

### 19.1 Never Do

- Launch a public page with no title, no description, no H1
- Block production pages in robots.txt by mistake
- Have two identical pages at different URLs without canonical
- Use client-only rendering for indexable marketing content
- Create subdomains without clear purpose or SEO policy
- Let preview/staging environments be indexable
- Use trailing slash inconsistency across the same site
- Duplicate content between omdala.com and omdalat.com without differentiation

### 19.2 Early Debt That Kills Scale

- Random subdomain proliferation without index policy
- Inconsistent canonical patterns
- Missing hreflang as multilingual grows
- Schema never implemented
- Internal linking ignored
- Sitemap never submitted

---

## 20. LAUNCH CHECKLIST — DAY ONE

Before any public launch, verify:

- [ ] All indexable pages have `<title>`, `<meta description>`, `<canonical>`
- [ ] `robots.txt` deployed and correct on each subdomain
- [ ] `sitemap.xml` deployed and valid
- [ ] Sitemap submitted to Google Search Console
- [ ] HTTPS enforced on all domains
- [ ] www redirect to non-www configured
- [ ] No preview or staging domain is publicly indexable
- [ ] Organization schema on homepage
- [ ] Open Graph tags on all public pages
- [ ] Core Web Vitals baseline measured
- [ ] H1 exists on every public page
- [ ] No broken internal links on key routes
- [ ] Multilingual hreflang in place if multiple languages live

---

## 21. FINAL DIRECTIVE

SEO is not a layer added later.

SEO is built into:
- routing logic
- metadata system
- rendering strategy
- content system
- subdomain architecture
- entity definition

If a page cannot be understood by a search engine from its HTML alone, it is not complete.

If a subdomain has no clear SEO role, it should not exist.

If content is live and indexable but has no entity logic, it is building debt.

OMDALA starts clean. It stays clean.

---

*SEO_MASTER_LOCK_OMDALA_SYSTEM.md — Version 1.0*
*Status: Final SEO Architecture Lock*
