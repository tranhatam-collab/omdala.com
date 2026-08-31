# OMDALA SEO Governance

**Version:** 1.0  
**Status:** LOCKED  
**Date:** 2026-04-28  
**Owner:** Team 1 (SEO/Content Lead)  
**Governed by:** `DOCS_DEV/SEO_CONTENT_EXECUTION_LOCK.md`, `DOCS_DEV/UNIVERSAL_BILINGUAL_LANGUAGE_AND_SEO_REBUILD_MASTER_LOCK_2026.md`

---

## 1. Quy tắc cốt lõi

1. **Mọi public page** phải có canonical đúng URL của nó (không phải `/`).
2. **Hreflang** phải có cho cả EN + VI + x-default.
3. **`<title>`** phải unique mỗi page, format `{Page} — OMDALA`.
4. **`<meta description>`** 140-160 chars, mô tả nội dung trang chính xác.
5. **Open Graph** + **Twitter card** đầy đủ trên mỗi page public.
6. **Schema.org** structured data: WebSite, Organization, BreadcrumbList per page.
7. **Sitemap.xml** auto-generate từ route map, có alternates EN+VI.
8. **robots.txt** allow toàn bộ public web; block admin/auth (noindex meta).

---

## 2. Implementation Lock (KHÔNG được sửa khi không có ADR)

| Concern | File | Function |
|---------|------|----------|
| Per-page metadata | `apps/web/app/lib/localized-metadata.ts` | `buildLocalizedMetadata(pageKey, language)` |
| URL builder | `packages/seo/src/utils.ts` | `buildSeoUrl(path)` |
| Schema | `packages/seo/src/schema.ts` | `getOrganizationSchema()`, `getWebSiteSchema()`, `getBreadcrumbSchema()` |
| SEO defaults | `packages/seo/src/constants.ts` | `SEO_DEFAULTS` |
| Sitemap | `apps/web/app/sitemap.ts` | Default Next.js sitemap |
| Robots | `apps/web/app/robots.ts` | Default Next.js robots |

---

## 3. Per-Page SEO Checklist

Mỗi public page cần:

- [ ] `export const metadata = buildLocalizedMetadata(<key>, <lang>)` (EN root + locale path qua `[lang]`)
- [ ] `<title>` unique theo nội dung
- [ ] `<meta description>` 140-160 chars, target keyword tự nhiên
- [ ] H1 duy nhất, match search intent
- [ ] H2-H3 cấu trúc rõ ràng, semantic
- [ ] Image alt text descriptive (không "image", "photo")
- [ ] Internal links có anchor text meaningful
- [ ] No broken links (verify qua audit)
- [ ] Canonical đúng URL của page
- [ ] Hreflang EN + VI + x-default
- [ ] OG title + description + image
- [ ] Twitter card

---

## 4. Bilingual SEO Rules

| Rule | EN | VI |
|------|-----|-----|
| `<html lang>` | `en` | `vi` |
| `<meta property="og:locale">` | `en_US` | `vi_VN` |
| Canonical | `https://omdala.com/<path>` | `https://omdala.com/vi/<path>` |
| hreflang en | EN URL | EN URL |
| hreflang vi | VI URL | VI URL |
| hreflang x-default | EN URL | EN URL |

---

## 5. Banned SEO patterns

- ❌ Keyword stuffing (lặp keyword > 3 lần / 100 từ)
- ❌ Thin content (< 200 từ visible content trên page chính)
- ❌ Duplicate `<title>` cross-pages
- ❌ Missing canonical
- ❌ Auto-translated copy without review (Google Translate raw)
- ❌ Hidden text/links cho SEO crawler
- ❌ Cloaking (nội dung khác cho crawler vs user)
- ❌ Doorway pages

---

## 6. Schema.org structures

### Organization (root layout)
```jsonld
{
  "@type": "Organization",
  "name": "OMDALA",
  "url": "https://omdala.com",
  "logo": "https://omdala.com/logo.svg",
  "description": "..."
}
```

### WebSite (root)
```jsonld
{
  "@type": "WebSite",
  "name": "OMDALA",
  "url": "https://omdala.com"
}
```

### WebPage + Breadcrumb (per page)
Defined in `packages/seo/src/schema.ts`, applied via `<SchemaScript>` component.

---

## 7. Validation

### Automated
```bash
npm run bilingual:public-audit  # canonical/hreflang/og/alt all-page check
npm run bilingual:source-check  # parity en.json vs vi.json
```

### Manual checklist (trước release)

- [ ] Lighthouse SEO score ≥ 95 (mobile + desktop)
- [ ] Google Rich Results Test pass cho schema
- [ ] No 404 trong sitemap
- [ ] robots.txt accessible
- [ ] Canonical headers consistent với page meta
- [ ] OG image render đúng trong Facebook Sharing Debugger

---

## 8. Performance budget

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID/INP | < 100ms |
| CLS | < 0.1 |
| TTFB | < 600ms |
| First Load JS | < 200KB |

---

## END
