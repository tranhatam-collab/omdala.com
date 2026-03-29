# TECHNICAL_SEO_IMPLEMENTATION_FILES_OMDALA.md

## OMDALA SYSTEM
## Technical SEO Implementation Lock
## Code-Level SEO Standard for omdala.com and *.omdala.com
## Version 1.0

---

## 1. PURPOSE

This file defines the actual code-level SEO implementation for the OMDALA ecosystem.

It specifies:
- required files and their content
- metadata system architecture
- structured data helpers
- robots and sitemap logic
- internal link patterns
- noindex handling
- performance SEO requirements
- launch validation checklist

DEV must implement these from the first commit. SEO is not retrofitted.

---

## 2. REQUIRED FILES PER DEPLOYABLE APP

At the root of each deployable project:

```
robots.txt              — crawl rules per subdomain
sitemap.xml             — or dynamic sitemap route
_headers                — HTTP security and SEO headers
_redirects              — canonical redirects (Cloudflare Pages)
```

In source code:
```
lib/seo/metadata.ts     — centralized metadata generator
lib/seo/schema.ts       — structured data helpers
lib/seo/constants.ts    — SEO constants (site name, base URL, OG image defaults)
components/LinkSEO.tsx  — internal link wrapper
```

---

## 3. robots.txt

### 3.1 omdala.com

```
User-agent: *
Allow: /

Disallow: /api/
Disallow: /admin/
Disallow: /internal/
Disallow: /preview/
Disallow: /_next/
Disallow: /static/chunks/

Sitemap: https://omdala.com/sitemap.xml
```

### 3.2 docs.omdala.com

```
User-agent: *
Allow: /

Disallow: /preview/
Disallow: /internal/
Disallow: /draft/

Sitemap: https://docs.omdala.com/sitemap.xml
```

### 3.3 trust.omdala.com

```
User-agent: *
Allow: /

Sitemap: https://trust.omdala.com/sitemap.xml
```

### 3.4 app.omdala.com

```
User-agent: *
Disallow: /
```

### 3.5 api.omdala.com

```
User-agent: *
Disallow: /
```

### 3.6 admin.omdala.com

```
User-agent: *
Disallow: /
```

### 3.7 omdalat.com

```
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /internal/

Sitemap: https://omdalat.com/sitemap.xml
```

---

## 4. SITEMAP.XML STRUCTURE

### 4.1 omdala.com — Sitemap Index

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://omdala.com/sitemap-pages.xml</loc>
    <lastmod>2026-01-01</lastmod>
  </sitemap>
</sitemapindex>
```

### 4.2 omdala.com — Pages Sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://omdala.com/</loc>
    <lastmod>2026-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://omdala.com/what-is-omdala</loc>
    <lastmod>2026-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://omdala.com/how-it-works</loc>
    <lastmod>2026-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://omdala.com/for-experts</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://omdala.com/for-hosts</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://omdala.com/for-communities</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://omdala.com/trust</loc>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://omdala.com/omdalat</loc>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://omdala.com/vision</loc>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://omdala.com/faq</loc>
    <priority>0.6</priority>
  </url>
</urlset>
```

### 4.3 Sitemap Rules

- Include only canonical, live, indexable URLs.
- Never include noindex, preview, authenticated, or empty pages.
- Regenerate automatically on content publish.
- Submit to Google Search Console on day one.

---

## 5. NEXT.JS METADATA SYSTEM

### 5.1 SEO Constants

```typescript
// lib/seo/constants.ts

export const SEO_DEFAULTS = {
  siteName:    'OMDALA',
  baseUrl:     'https://omdala.com',
  description: 'The global operating layer for real-world value, trust, and intelligent coordination.',
  ogImage:     'https://omdala.com/og-default.png',
  twitterHandle: '@omdala',
} as const
```

### 5.2 Metadata Generator

```typescript
// lib/seo/metadata.ts

import type { Metadata } from 'next'
import { SEO_DEFAULTS } from './constants'

interface PageMetadataInput {
  title:        string
  description?: string
  path:         string
  ogImage?:     string
  noindex?:     boolean
}

export function buildMetadata(input: PageMetadataInput): Metadata {
  const {
    title,
    description = SEO_DEFAULTS.description,
    path,
    ogImage = SEO_DEFAULTS.ogImage,
    noindex = false,
  } = input

  const url = `${SEO_DEFAULTS.baseUrl}${path}`

  return {
    title: `${title} — ${SEO_DEFAULTS.siteName}`,
    description,
    metadataBase: new URL(SEO_DEFAULTS.baseUrl),
    alternates: {
      canonical: url,
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title:       `${title} — ${SEO_DEFAULTS.siteName}`,
      description,
      url,
      siteName:    SEO_DEFAULTS.siteName,
      type:        'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card:        'summary_large_image',
      title:       `${title} — ${SEO_DEFAULTS.siteName}`,
      description,
      images:      [ogImage],
    },
  }
}
```

### 5.3 Page Usage

```typescript
// app/page.tsx

import { buildMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = buildMetadata({
  title:       'The Operating Layer for Real-World Value',
  description: 'OMDALA is the global operating layer for real-world value, trust, and intelligent coordination.',
  path:        '/',
})
```

```typescript
// app/how-it-works/page.tsx

export const metadata: Metadata = buildMetadata({
  title:       'How It Works',
  description: 'Understand how OMDALA coordinates people, places, resources, and trust at global scale.',
  path:        '/how-it-works',
})
```

### 5.4 noindex Usage

```typescript
// app/preview/[...slug]/page.tsx

export const metadata: Metadata = buildMetadata({
  title:   'Preview',
  path:    '/preview',
  noindex: true,
})
```

---

## 6. CANONICAL TAG RULE

- Every page must include an explicit canonical URL.
- Use `alternates.canonical` in Next.js `metadata` export — this generates `<link rel="canonical">` in the `<head>`.
- Never rely on framework defaults without explicit verification.
- Canonical must be HTTPS, non-www, no trailing slash inconsistency.

---

## 7. STRUCTURED DATA HELPERS

```typescript
// lib/seo/schema.ts

const BASE_URL = 'https://omdala.com'

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type':    'Organization',
    name:       'OMDALA',
    url:         BASE_URL,
    logo:       `${BASE_URL}/logo.png`,
    description: 'The global operating layer for real-world value, trust, and intelligent coordination.',
    sameAs:     [
      // add official social profiles here when live
    ],
  }
}

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type':    'WebSite',
    name:       'OMDALA',
    url:         BASE_URL,
  }
}

export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context':        'https://schema.org',
    '@type':           'BreadcrumbList',
    itemListElement:    items.map((item, index) => ({
      '@type':   'ListItem',
      position:   index + 1,
      name:       item.name,
      item:       item.url,
    })),
  }
}
```

### 7.1 Schema Injection Component

```typescript
// components/SchemaScript.tsx

interface SchemaScriptProps {
  schema: Record<string, unknown> | Record<string, unknown>[]
}

export function SchemaScript({ schema }: SchemaScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 0),
      }}
    />
  )
}
```

### 7.2 Homepage Usage

```typescript
// app/page.tsx

import { SchemaScript }         from '@/components/SchemaScript'
import { getOrganizationSchema, getWebSiteSchema } from '@/lib/seo/schema'

export default function HomePage() {
  return (
    <>
      <SchemaScript schema={[getOrganizationSchema(), getWebSiteSchema()]} />
      {/* page content */}
    </>
  )
}
```

---

## 8. OPEN GRAPH DEFAULT IMAGE

Required: `public/og-default.png`

Specifications:
- Dimensions: 1200 × 630 px
- Format: PNG
- Content: OMDALA brand name + tagline on brand-correct background
- Must match OMDALA visual identity

---

## 9. hreflang STRUCTURE

Multilingual setup (Phase 1: en + vi):

```typescript
// In buildMetadata or layout:

alternates: {
  canonical: url,
  languages: {
    'en':        `https://omdala.com${path}`,
    'vi':        `https://omdala.com/vi${path}`,
    'x-default': `https://omdala.com${path}`,
  },
}
```

Rules:
- Never use `?lang=vi` query parameters.
- Language variants must have distinct paths.
- Every language variant must have its own metadata.

---

## 10. NOINDEX SYSTEM

### 10.1 Automatic noindex Conditions

Apply noindex when any of the following is true:
- Page is a preview or staging environment
- Page requires authentication to view
- Page has no meaningful content (empty, placeholder)
- Page is internal/admin
- Page is a duplicate with a canonical pointing elsewhere

### 10.2 Implementation

```typescript
// Middleware or layout-level check
// lib/seo/isNoIndex.ts

export function shouldBeNoIndex(context: {
  isPreview:        boolean
  isAuthenticated:  boolean
  hasContent:       boolean
  isAdmin:          boolean
}): boolean {
  return (
    context.isPreview ||
    context.isAuthenticated ||
    !context.hasContent ||
    context.isAdmin
  )
}
```

### 10.3 HTTP Header Rule

For entire subdomains (e.g. `app.omdala.com`), use `_headers` file:

```
/*
  X-Robots-Tag: noindex, nofollow
```

---

## 11. INTERNAL LINK COMPONENT

All internal links must render as `<a>` tags in HTML.

```typescript
// components/LinkSEO.tsx

import Link from 'next/link'
import type { ComponentProps } from 'react'

type LinkSEOProps = ComponentProps<typeof Link> & {
  external?: boolean
}

export function LinkSEO({ external = false, ...props }: LinkSEOProps) {
  if (external) {
    return (
      <a
        href={props.href as string}
        target="_blank"
        rel="noopener noreferrer"
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    )
  }
  return <Link {...props} />
}
```

Rules:
- Use `LinkSEO` for all navigational links in content.
- Never use `onClick` + `router.push` as the only navigation method on indexable pages.
- Anchor text must be descriptive — never "click here" or "read more".

---

## 12. IMAGE COMPONENT RULE

```typescript
// Use next/image for all content images

import Image from 'next/image'

<Image
  src="/brand/hero-visual.png"
  alt="OMDALA global operating layer — connected nodes across the world"
  width={1200}
  height={675}
  priority={true}   // for above-the-fold images
/>
```

Rules:
- All `<img>` elements must have descriptive `alt` text.
- `alt=""` is acceptable only for purely decorative images.
- `width` and `height` must be set to prevent CLS.
- Use `priority` for the largest above-the-fold image (LCP target).

---

## 13. _headers FILE

```
# Applied to all routes
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

# Static assets — aggressive caching
/static/*
  Cache-Control: public, max-age=31536000, immutable

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
```

CSP must be tuned per-subdomain. Minimum:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;
```

Adjust as third-party scripts are added.

---

## 14. _redirects FILE

```
# HTTP to HTTPS (Cloudflare handles this, but defense-in-depth)
http://* https://:splat 301

# www to non-www
https://www.omdala.com/* https://omdala.com/:splat 301

# Next.js SPA fallback (only if not using SSR for all routes)
/* /index.html 200
```

---

## 15. 404 PAGE

```typescript
// app/not-found.tsx

export default function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <LinkSEO href="/">Return to OMDALA</LinkSEO>
      <LinkSEO href="/what-is-omdala">What is OMDALA</LinkSEO>
      <LinkSEO href="/how-it-works">How it works</LinkSEO>
    </main>
  )
}
```

Rules:
- Must return HTTP 404 status.
- Must have H1 and helpful navigation links.
- Must not be empty.
- Must not redirect to homepage (masked 404 is an SEO anti-pattern).

---

## 16. PERFORMANCE SEO RULES

### 16.1 Rendering Strategy

| Page type | Strategy |
|---|---|
| Marketing pages (omdala.com) | SSG — build time |
| Docs pages | SSG or ISR |
| Trust pages | SSG |
| Dynamic public profiles (future) | SSR |
| Authenticated app routes | CSR (noindex anyway) |

### 16.2 Core Web Vitals Targets

| Metric | Target |
|---|---|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |

### 16.3 JS Bundle Rules

- Do not import heavy libraries on landing page entry point.
- Use dynamic imports for components below the fold.
- Never block rendering with synchronous third-party scripts.

---

## 17. SEARCH CONSOLE SETUP

Register and verify all primary indexable domains on day one:

```
omdala.com              → verify via DNS TXT record
docs.omdala.com         → verify via DNS TXT record
trust.omdala.com        → verify via DNS TXT record
omdalat.com             → verify via DNS TXT record
```

After verification:
1. Submit sitemap for each domain
2. Request indexing for homepage and key pages
3. Monitor for crawl errors weekly
4. Monitor Core Web Vitals report weekly

---

## 18. SEO TEST CHECKLIST — PRE-DEPLOY

Run before every production deploy:

### Per-Page Checks
- [ ] `<title>` is unique and present
- [ ] `<meta name="description">` is present and ≤ 160 chars
- [ ] `<link rel="canonical">` matches the correct URL
- [ ] `<h1>` is present and unique
- [ ] Meaningful content exists in server-rendered HTML
- [ ] Page is crawlable (not blocked by robots.txt)
- [ ] Page loads correctly on mobile viewport
- [ ] Open Graph tags present with valid image
- [ ] noindex not accidentally applied to indexable pages
- [ ] noindex correctly applied to private/preview pages

### Site-Wide Checks
- [ ] `robots.txt` deployed and verified
- [ ] `sitemap.xml` deployed and valid
- [ ] No broken internal links on key routes
- [ ] No duplicate `<h1>` tags per page
- [ ] Schema JSON-LD present on homepage
- [ ] `_headers` file deployed with security headers
- [ ] All redirects functioning correctly
- [ ] HTTPS enforced on all subdomains

---

## 19. FINAL DIRECTIVE

If a page cannot be understood by a search engine from its HTML alone, it is not complete.

If a page has no title, no H1, no canonical, it must not be deployed publicly.

If a subdomain has no `robots.txt`, it is not ready for production.

SEO is not a layer added later.

SEO is built into:
- routing
- metadata
- rendering
- content
- schema

OMDALA launches clean. OMDALA stays clean.

---

*TECHNICAL_SEO_IMPLEMENTATION_FILES_OMDALA.md — Version 1.0*
*Status: Final Technical SEO Lock*
