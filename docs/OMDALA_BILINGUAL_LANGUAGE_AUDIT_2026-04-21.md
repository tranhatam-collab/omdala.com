# OMDALA Bilingual Language Audit

Status: In progress
Snapshot date: April 22, 2026
Scope: `apps/web` public surface first, then shared product surfaces

## Applied through the latest patch

1. Added bilingual content source:
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/content/vi.json`
   - `/Users/tranhatam/Documents/Devnewproject/omdala.com/content/en.json`
2. Moved shared chrome, logo alt text, not-found copy, and page-level SEO metadata into controlled bilingual source and helper access.
3. Migrated the full `en` and `vi` body copy for these public pages to the controlled source:
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
4. Removed stale duplicate route metadata files such as `head 2.tsx` and `layout 2.tsx` inside `apps/web/app`.
5. Cleaned visible Vietnamese wording that was weak, mixed, or off-tone in the active public surface.

## Current surface status

| Surface | File scope | Current status | Notes |
| --- | --- | --- | --- |
| Global nav/footer/header CTA | `apps/web/app/WebChrome.tsx` | Fixed for `en` and `vi` | Reads from bilingual source |
| Root and route metadata | `apps/web/app/**/head.tsx`, `apps/web/app/lib/localized-metadata.ts` | Fixed for `en` and `vi` | Other ready locales still fall back to existing metadata map |
| Homepage body | `apps/web/app/HomePageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| What OMDALA Is body | `apps/web/app/what-is-omdala/WhatIsOmdalaPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| How It Works body | `apps/web/app/how-it-works/HowItWorksPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| For Experts body | `apps/web/app/for-experts/ForExpertsPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| For Hosts body | `apps/web/app/for-hosts/ForHostsPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| For Communities body | `apps/web/app/for-communities/ForCommunitiesPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| Trust body | `apps/web/app/trust/TrustPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| Vision body | `apps/web/app/vision/VisionPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| FAQ body | `apps/web/app/faq/FaqPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| Contact body | `apps/web/app/contact/ContactPageView.tsx` | Fixed for `en` and `vi` | Reads from bilingual source, other locales keep legacy fallback |
| 404 copy | `apps/web/app/not-found.tsx`, `apps/web/app/[lang]/not-found.tsx` | Fixed for root and localized rendering | Source-controlled |
| Legacy fallback source | `apps/web/app/lib/content.ts` | Partially retained by design | Still powers fallback for `zh`, `es`, `ja`, and `ko`, plus non-migrated product copy outside public web |
| Root document language | `apps/web/app/layout.tsx`, `apps/web/app/WebPageShell.tsx`, `packages/ui/src/components/DocumentLanguageSync.tsx` | Runtime sync improved | Root layout still renders `<html lang="en">`, but page shell now passes the active language to runtime document sync |
| Public web live language set | `apps/web/app/lib/locale-routing.ts`, `apps/web/app/components/LanguageSwitcher.tsx`, `apps/web/app/lib/localized-metadata.ts`, `apps/web/app/sitemap.ts` | Fixed for bilingual launch | Public web generation, switcher, sitemap alternates, and metadata alternates are restricted to `en` and `vi` |
| Image alt inventory | `apps/web/public/**`, rendered image usage | Inventory published | See `docs/TEAM_1_BILINGUAL_PUBLIC_WEB_EVIDENCE_2026-04-23.md`; Team 3 still needs rendered crawl confirmation |
| Product surfaces | `apps/app`, `apps/auth`, `apps/admin`, `packages/ui` | Pending migration | Team 2 ownership in the synchronized execution board |
| Publish gate and report | `scripts/**`, release docs | Pending implementation | Team 3 ownership in the synchronized execution board |

## Current interpretation

For the public web layer, the mandatory `en` and `vi` body-copy migration is now complete across the main public route set. The bilingual rebuild is not complete overall because the release-grade system still lacks:

1. server-side route-aware document language handling, or Team 3 approval that runtime sync is sufficient for this release
2. rendered image alt-text audit confirmation
3. controlled-source migration across app, auth, admin, and shared UI
4. publish blocking when `vi` or `en` content is missing
5. final 4-pass review evidence: AI, editor, SEO, QA

## Priority queue after this snapshot

1. Lock the synchronized 3-team execution plan for the bilingual rebuild.
2. Inventory and centralize user-facing text in `apps/app`, `apps/auth`, `apps/admin`, and `packages/ui`.
3. Add validation and release gates so missing `vi` or `en` content blocks publish.
4. Audit image alt text, internal links, canonical output, hreflang, and language switch behavior before live.
5. Produce the founder-facing pre-live report required by the bilingual command doc.

## Release rule

Do not mark the bilingual rebuild complete yet.

The public `apps/web` route set is now materially stronger and substantially centralized for `en` and `vi`, but OMDALA still needs product-surface cleanup, validation gates, and final release evidence before the site can be considered bilingual-live ready.
