# OMDALA Bilingual Language Audit

Status: In progress
Scope: `apps/web` public surface

## Applied in this patch

1. Added bilingual content source:
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/content/vi.json`
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/content/en.json`
2. Moved shared chrome, logo alt text, static English SEO head props, and not-found copy to controlled source.
3. Added bilingual body-copy source for `for-hosts`, `contact`, `for-experts`, `faq`, `trust`, and `vision`.
4. Removed stale duplicate route metadata files such as `head 2.tsx` and `layout 2.tsx` inside `apps/web/app`.
5. Standardized Vietnamese public terms for navigation, page body copy, and SEO metadata away from mixed or weak wording.

## Current surface status

| Surface | File scope | Current status | Notes |
| --- | --- | --- | --- |
| Global nav/footer/header CTA | `apps/web/app/WebChrome.tsx` | Fixed in this patch | Reads from bilingual source |
| Root English SEO heads | `apps/web/app/**/head.tsx` | Fixed in this patch | Centralized through shared helper |
| Localized metadata | `apps/web/app/lib/localized-metadata.ts` | Fixed for `en` and `vi` | Other ready languages still fall back to existing metadata map |
| For-experts page body | `apps/web/app/for-experts/ForExpertsPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| For-hosts page body | `apps/web/app/for-hosts/ForHostsPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| Trust page body | `apps/web/app/trust/TrustPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| Vision page body | `apps/web/app/vision/VisionPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| FAQ page body | `apps/web/app/faq/FaqPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| Contact page body | `apps/web/app/contact/ContactPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| 404 copy | `apps/web/app/not-found.tsx`, `apps/web/app/[lang]/not-found.tsx` | Fixed for English root and localized route rendering | Metadata still defaults to root English template |
| Page body copy | `apps/web/app/lib/content.ts` | Pending migration | Large shared content file still contains many public strings for other pages |
| Stale duplicate metadata files | `apps/web/app/**/*head 2.tsx`, `apps/web/app/layout 2.tsx` | Cleaned | Removed obsolete duplicate files that could confuse handoff |
| Legacy Vietnamese wording cleanup | `apps/web/app/lib/content.ts` | Partially fixed | Removed visible terms such as `điểm đón`, `Bề mặt liên hệ`, and Vietnamese public `marketplace` wording in current public copy |
| Document language attribute | `apps/web/app/layout.tsx` | Pending architecture follow-up | Root layout still owns a global `<html lang="en">` |

## Priority queue after this patch

1. Migrate remaining page body content from `apps/web/app/lib/content.ts` into bilingual content source page-by-page.
2. Normalize remaining operating-surface terminology across all sections that still render from legacy content.
3. Add a publish gate so pages cannot ship when either `vi` or `en` content is missing.
4. Add a pre-live report that counts URLs, metadata fixes, alt text fixes, and unresolved pages.

## Release rule

Do not mark the bilingual rebuild complete yet. This patch establishes the mandatory source-of-truth layer and removes the highest-risk hard-coded public text, but the full public body copy migration is still open.
