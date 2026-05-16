# TECHNICAL_SEO_IMPLEMENTATION_FILES_OMDALA

## OMDALA SYSTEM
## Technical SEO Implementation Lock
## Version 1.1

---

## 1. Purpose

This file defines the code-level SEO requirements for all first-party OMDALA surfaces.

SEO must be built into:

- routing
- metadata
- rendering
- robots policy
- canonical handling
- sitemap generation

---

## 2. Required files by public surface

For `apps/web`:

- `public/robots.txt`
- `public/_headers`
- `public/_redirects`
- metadata generator
- JSON-LD helpers
- sitemap generation

For `apps/docs`:

- `public/robots.txt`
- `public/_headers`
- metadata support

For `apps/app` and `apps/admin`:

- `robots.txt`
- noindex defaults

---

## 3. Metadata system

Every public page must support:

- title
- description
- canonical
- Open Graph
- Twitter meta
- robots override when needed

Use one centralized metadata helper per surface.

---

## 4. Canonical rules

Every indexable page must emit a self-referencing canonical unless intentionally consolidated.

Do not:

- canonicalize to a different subdomain by accident
- canonicalize previews
- canonicalize non-existent pages

---

## 5. Structured data

Use JSON-LD only.

Current approved helpers:

- `Organization`
- `WebSite`
- `BreadcrumbList`
- `TechArticle`

Only emit structured data that matches visible content.

---

## 6. Rendering rules

Public pages must expose meaningful HTML immediately.

Required in HTML:

- H1
- intro copy
- crawlable links
- page topic

Do not hide primary meaning behind hydration.

---

## 7. Noindex handling

Use explicit noindex for:

- authenticated app routes
- admin routes
- previews
- empty placeholder pages
- internal-only docs

---

## 8. Internal links

Critical internal links must render as normal anchors in HTML.

Do not use JS-only click handlers for core crawl paths.

---

## 9. Sitemap rules

Only include:

- canonical URLs
- existing pages
- indexable pages

Never include:

- redirects
- placeholders
- previews
- protected routes

---

## 10. QA checklist

Before deploy, confirm:

- page title is present
- meta description is present
- canonical is correct
- robots policy is correct
- page has one clear H1
- page has meaningful body copy
- page is internally linked
- page exists in sitemap only if it is truly indexable

---

## 11. Final rule

If a page cannot be understood by a search engine from HTML, metadata, and links alone, it is not complete.
