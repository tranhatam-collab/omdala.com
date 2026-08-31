# SEO_MASTER_LOCK_OMDALA_SYSTEM

## OMDALA.COM
## Global SEO + Subdomain Architecture Lock
## Version 1.1

---

## 1. Purpose

This document locks the SEO architecture for the OMDALA master domain and first-party OMDALA subdomains.

It exists to ensure:

- one canonical host strategy
- one metadata discipline
- one crawl/index policy per surface
- one multilingual-ready URL logic
- one search-understandable brand entity

---

## 2. Search definition

OMDALA should be understood as:

- a global operating layer for real-world value
- a trust and coordination platform
- a system for people, places, resources, and action

It must not read like:

- a generic AI startup
- a marketplace-only site
- a travel product
- a thin content brand shell

---

## 3. Canonical host

Preferred canonical host:

`https://omdala.com`

Rules:

- force HTTPS
- force non-www
- redirect `www.omdala.com` to `omdala.com`

---

## 4. Approved OMDALA subdomains

- `omdala.com`
- `app.omdala.com`
- `api.omdala.com`
- `docs.omdala.com`
- `admin.omdala.com`
- `trust.omdala.com`
- `status.omdala.com`

Any future implementation domain must receive its own SEO lock file. It must not inherit the root
domain canonicals by assumption.

---

## 5. Indexability policy

`omdala.com`

- indexable
- builds the master brand entity

`app.omdala.com`

- authenticated routes default to noindex
- public marketing or public object routes only if intentionally approved

`api.omdala.com`

- noindex
- raw endpoints are not SEO surfaces

`docs.omdala.com`

- indexable for public documentation
- draft or preview docs must be noindex

`admin.omdala.com`

- noindex
- protect at edge and application layers

---

## 6. Approved public routes on omdala.com

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

Only real pages should enter the sitemap.

---

## 7. Metadata rules

Every indexable page must have:

- unique title
- unique meta description
- canonical
- Open Graph
- Twitter meta
- crawlable internal links

Metadata must be server-rendered.

---

## 8. Rendering rules

Public SEO pages must be SSR, SSG, or hybrid-rendered.

Critical meaning must exist in HTML:

- H1
- core intro copy
- internal links
- page purpose

Do not rely on client-only rendering for primary search meaning.

---

## 9. Structured data

Use JSON-LD.

Approved schemas at masterbrand level:

- `Organization`
- `WebSite`
- `BreadcrumbList`
- `TechArticle` when truly appropriate

Only mark up visible and truthful content.

---

## 10. Multilingual

Build multilingual-ready from the start.

Preferred pattern:

- `omdala.com/en/...`
- `omdala.com/vi/...`

Do not switch language on the same URL only by IP or browser detection.

---

## 11. Robots and sitemap

Required:

- `robots.txt`
- `sitemap.xml`
- noindex support for non-public routes

Do not include non-existent, preview, or redirected URLs in sitemaps.

---

## 12. Internal linking

Homepage must link to:

- what the system is
- how it works
- trust
- vision
- role-based pages
- docs and app surfaces

No important page should be orphaned.

---

## 13. Anti-patterns

Do not ship:

- duplicate metadata
- empty indexable pages
- app-shell-only marketing pages
- canonical conflicts across subdomains
- implementation-specific brand references on the master site unless explicitly approved

---

## 14. Final rule

Search architecture is part of product architecture. If a public page cannot be clearly understood
from HTML and metadata alone, it is not ready.
