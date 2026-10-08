# Team 1 Bilingual Public Web Evidence

Date: April 23, 2026
Status: Active Team 1 evidence
Scope: `apps/web`, `content/en.json`, `content/vi.json`, public SEO and UI text

## 1. Current Team 1 status

| Task ID | Status | Evidence |
| --- | --- | --- |
| `BL-S1-T1-01` | `done` | Main public routes read `en` and `vi` body copy from `content/en.json` and `content/vi.json` |
| `BL-S1-T1-02` | `done` | Metadata source parity is inventoried below; Team 3 must confirm rendered output with crawl |
| `BL-S1-T1-03` | `done` | CTA, menu, footer, and image alt inventory is listed below; Team 3 must confirm rendered output |
| `BL-S2-T1-01` | `done` | Public web route generation, switcher, sitemap alternates, and metadata alternates are locked to `en` and `vi`; runtime document language sync reads the active route language |

## 2. Public route inventory

| Route | Page key | Body source | Metadata source | Status |
| --- | --- | --- | --- | --- |
| `/` | `home` | `content.*.publicPages.home` | `content.*.pages.home` | source locked |
| `/what-is-omdala` | `whatIsOmdala` | `content.*.publicPages.whatIsOmdala` | `content.*.pages.whatIsOmdala` | source locked |
| `/how-it-works` | `howItWorks` | `content.*.publicPages.howItWorks` | `content.*.pages.howItWorks` | source locked |
| `/for-experts` | `forExperts` | `content.*.publicPages.forExperts` | `content.*.pages.forExperts` | source locked |
| `/for-hosts` | `forHosts` | `content.*.publicPages.forHosts` | `content.*.pages.forHosts` | source locked |
| `/for-communities` | `forCommunities` | `content.*.publicPages.forCommunities` | `content.*.pages.forCommunities` | source locked |
| `/trust` | `trust` | `content.*.publicPages.trust` | `content.*.pages.trust` | source locked |
| `/vision` | `vision` | `content.*.publicPages.vision` | `content.*.pages.vision` | source locked |
| `/faq` | `faq` | `content.*.publicPages.faq` | `content.*.pages.faq` | source locked |
| `/contact` | `contact` | `content.*.publicPages.contact` | `content.*.pages.contact` | source locked |

## 3. Metadata parity inventory

All listed public pages have separate `seoTitle`, `seoDescription`, and `breadcrumbLabel` in:

- `content/en.json`
- `content/vi.json`

Rendering paths:

- root route heads call `getStaticSeoHeadProps(pageKey)`
- localized route metadata calls `buildLocalizedMetadata(pageKey, language)`
- `buildLocalizedMetadata` uses `getPageCopy(pageKey, language)` for `en` and `vi`
- canonical and language alternates flow through `buildLanguageAlternates`
- public web alternates are restricted to `en`, `vi`, and `x-default`
- localized metadata no longer keeps hard-coded fallback metadata for non-live languages

Team 3 crawler must still verify rendered HTML for:

- canonical
- hreflang
- OG title
- OG description
- Twitter title
- Twitter description
- schema name and description

## 4. CTA, menu, and footer inventory

| Surface | Source | Notes |
| --- | --- | --- |
| Primary nav | `content.*.site.chrome.nav` | what, how, experts, hosts, communities, trust, vision |
| Header app CTA | `content.*.site.chrome.enterApp` | rendered in `apps/web/app/WebChrome.tsx` |
| Language switcher aria label | `content.*.site.chrome.labels.languageSwitcher` | passed to `LanguageSwitcher` |
| Footer section labels | `content.*.site.chrome.sections` | platform, access points, legal |
| Footer links | `content.*.site.chrome.links` | OMDALA routes, app, docs, API status |
| Homepage hero CTAs | `content.*.publicPages.home.heroCta*` | primary, secondary, docs |
| Homepage final CTAs | `content.*.publicPages.home.finalCta` | primary and contact CTA |
| Contact mail links | `apps/web/app/contact/ContactPageView.tsx` plus controlled body copy | email addresses are constants, surrounding text is sourced |

## 5. Image and alt-text inventory

| Image asset | Rendered in | Alt source | Status |
| --- | --- | --- | --- |
| `/logo.svg` | header brand mark | `getBrandLogoAlt(language)` from `content.*.site.brandLogoAlt` | source locked for `en` and `vi` |
| `/logo.svg` | footer brand mark | `getBrandLogoAlt(language)` from `content.*.site.brandLogoAlt` | source locked for `en` and `vi` |
| `/og-default.svg` | metadata/social image | generated from page title through metadata builders | needs Team 3 rendered metadata crawl |

Current public asset inventory:

- `apps/web/public/logo.svg`
- `apps/web/public/og-default.svg`

No other public web image assets were found in `apps/web/public` during this pass.

## 6. Runtime language handling update

Updated:

- `packages/ui/src/components/DocumentLanguageSync.tsx`
- `apps/web/app/WebPageShell.tsx`
- `apps/web/app/components/LanguageSwitcher.tsx`
- `apps/web/app/WebChrome.tsx`

Current behavior:

- `WebPageShell` passes the resolved route language into `DocumentLanguageSync`
- `DocumentLanguageSync` accepts an explicit language and falls back to route-prefix detection when needed
- route-prefixed pages such as `/vi/...` now update `document.documentElement.lang` at runtime
- language switcher has a language-specific aria label from chrome copy
- public web localized static params are restricted to the bilingual live set: `en` as default root and `vi` as the prefixed route
- public web language switcher renders only `English` and `Tiếng Việt`
- public web sitemap and metadata alternates emit only `en`, `vi`, and `x-default`
- public web chrome copy now reads directly from the controlled `en/vi` source without non-live language overrides

Remaining architecture note:

- the server-rendered root layout still defaults to `<html lang="en">`
- Team 3 crawler should record whether the runtime language sync is sufficient for the current release, or whether a server-side routing architecture change is required before live

## 7. Team 1 handoff to Team 3

Team 3 can now use this file as the Team 1 public web handoff for:

- metadata source parity
- route/body source coverage
- CTA/menu/footer source coverage
- image and alt-text inventory
- document language follow-up status

Team 1 final sign-off has been issued on 2026-04-28 after Team 3 crawler confirmed 20/20 URLs pass with 0 blocking issues. See `docs/TEAM_1_FINAL_SIGNOFF_2026-04-27.md` for the canonical signed artifact.
