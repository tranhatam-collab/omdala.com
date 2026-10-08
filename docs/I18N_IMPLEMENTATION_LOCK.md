# OMDALA I18N Implementation Lock

**Version:** 1.0  
**Status:** LOCKED — ADR-003 active  
**Date:** 2026-04-28  
**Owner:** Team 1 (Frontend Lead)  
**Governed by:** `docs/20_architecture/ARCHITECTURE_DECISIONS.md` ADR-003, ADR-004

---

## 1. Locked Routing Strategy

### Public web (`apps/web`)
- EN routes (default): `/`, `/what-is-omdala/`, `/how-it-works/`, ...
- VI routes (prefixed): `/vi/`, `/vi/what-is-omdala/`, `/vi/how-it-works/`, ...
- Future locales (zh, es, ja, ko): code path tồn tại nhưng **NOT generated** trong build hiện tại

### App/Auth/Admin (authenticated)
- KHÔNG có URL prefix theo ngôn ngữ
- Language qua cookie + DocumentLanguageSync (client)
- Server pages KHÔNG dùng `searchParams` (per ADR-011)

---

## 2. Source File Layout (LOCKED)

```
content/
├── en.json          ← English source
└── vi.json          ← Vietnamese source (semantic master)
```

**Cả 2 file phải có:**
- `site.brandName`
- `site.brandLogoAlt`
- `site.chrome.{nav,links,labels,sections,...}`
- `site.notFound`
- `pages.{home,whatIsOmdala,...}.{seoTitle,seoDescription,breadcrumbLabel,heroEyebrow,...}`
- `publicPages.{home,whatIsOmdala,...}.{heroTitle,heroLead,...}` (body content)

**Parity rule:** Cấu trúc keys EN và VI phải hoàn toàn giống nhau. Validate qua `scripts/bilingual-source-check.mjs`.

---

## 3. Read API Lock

| Use case | Function | File |
|----------|----------|------|
| Get page copy (typed) | `getPageCopy<K>(pageKey, language)` | `apps/web/app/lib/bilingual-source.ts` |
| Get public page body | `getPublicPageBodyCopy<K>(pageKey, language)` | same |
| Get chrome (header/footer) | `getChromeCopy(language)` | same |
| Get logo alt | `getBrandLogoAlt(language)` | same |
| Get not-found copy | `getNotFoundCopy(language)` | same |
| Build localized metadata | `buildLocalizedMetadata(pageKey, language)` | `apps/web/app/lib/localized-metadata.ts` |

---

## 4. Component Conventions

### Public web routes
- EN root: `apps/web/app/<route>/page.tsx`
- VI: `apps/web/app/[lang]/<route>/page.tsx` with `generateStaticParams`

### Pattern for page.tsx (EN root)
```tsx
import type { Metadata } from 'next'
import { <Page>View } from './<Page>View'
import { buildLocalizedMetadata } from '../lib/localized-metadata'

export const metadata: Metadata = buildLocalizedMetadata('<pageKey>', 'en')

export default function <Page>Page() {
  return <<Page>View locale="en" />
}
```

### Pattern for `[lang]/<route>/page.tsx` (multilingual)
```tsx
import type { Metadata } from 'next'
import { <Page>View } from '../../<route>/<Page>View'
import { buildLocalizedMetadata } from '../../lib/localized-metadata'
import { getPrefixedLocaleStaticParams, resolveRouteLanguage } from '../../lib/locale-routing'

export const dynamicParams = false

export function generateStaticParams() {
  return getPrefixedLocaleStaticParams()
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const language = resolveRouteLanguage((await params).lang)
  return buildLocalizedMetadata('<pageKey>', language)
}

export default async function Localized<Page>Page({ params }: { params: Promise<{ lang: string }> }) {
  const language = resolveRouteLanguage((await params).lang)
  return <<Page>View locale={language} />
}
```

### Page View component
Chỉ nhận `locale` prop, tự đọc từ controlled source:
```tsx
export function HomePageView({ locale }: { locale: OmdalaLanguage }) {
  const body = isBilingualLanguage(locale) ? getPublicPageBodyCopy('home', locale) : null
  // render body or fallback to homeContent (legacy multi-locale)
}
```

---

## 5. Document Language Sync

`apps/web/app/WebPageShell.tsx` luôn render `<DocumentLanguageSync language={language} />` để client biết:
- Set `document.documentElement.lang`
- Update `<html lang>` runtime nếu cần
- Sync với cookie `omdala_lang`

---

## 6. Language Switcher

`apps/web/app/components/LanguageSwitcher.tsx` chuyển ngôn ngữ qua URL navigation (không state):

| Click "Tiếng Việt" tại | Redirect tới |
|------------------------|--------------|
| `/` | `/vi/` |
| `/what-is-omdala/` | `/vi/what-is-omdala/` |
| `/vi/contact/` | `/contact/` (back to EN) |

---

## 7. Forbidden Patterns

- ❌ Hard-code public text trong component (`<h1>Welcome</h1>` cấm — phải qua content/)
- ❌ Tạo dictionary thứ 3 ngoài `content/{en,vi}.json` cho web public
- ❌ Sửa `en.json` mà không sửa `vi.json` cùng PR
- ❌ Dùng Google Translate output mà không có review của Content Lead
- ❌ Mix English vào Vietnamese ("Đăng ký để nhận update") — phải full Vietnamese
- ❌ Server component đọc `searchParams.lang` (dynamic conflict với static export)

---

## 8. Approved Source for Auth/App/Admin Surfaces

| Surface | Source |
|---------|--------|
| `apps/auth` | `packages/ui/src/copy/auth-copy.ts` (`AUTH_COPY`) |
| `apps/app` (auth flows) | `apps/app/lib/bilingual-copy.ts` + `AUTH_COPY` |
| `apps/app` (dashboard) | `apps/app/lib/vi-labels.ts` + `bilingual-copy.ts` |
| `apps/admin` | `packages/ui/src/copy/shared-ui-copy.ts` (TBD per Team 2) |
| `apps/docs` | TBD per Team 2 |

---

## 9. Migration Notes (Reference)

- 2026-04-22: Bilingual master lock applied
- 2026-04-23: Sprint 2 active — Team 2 inventory + source strategy in progress
- 2026-04-28: Bilingual gate PASS — 20/20 URLs

---

## END
