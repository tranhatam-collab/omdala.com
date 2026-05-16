import type { OmdalaLanguage } from "@omdala/core";
import { OMDALA_PAGES, buildSeoUrl } from "@omdala/seo";
import enSource from "../../../../content/en.json";
import viSource from "../../../../content/vi.json";

export type BilingualLocale = "en" | "vi";
export type BilingualPageKey = keyof typeof enSource.pages;
export type BilingualChromeCopy = typeof enSource.site.chrome;
export type BilingualPublicPageKey = keyof typeof enSource.publicPages;

const SOURCE = {
  en: enSource,
  vi: viSource,
} as const;

const PAGE_PATHS: Record<BilingualPageKey, string> = {
  home: OMDALA_PAGES.home,
  whatIsOmdala: OMDALA_PAGES.whatIsOmdala,
  howItWorks: OMDALA_PAGES.howItWorks,
  forExperts: OMDALA_PAGES.forExperts,
  forHosts: OMDALA_PAGES.forHosts,
  forCommunities: OMDALA_PAGES.forCommunities,
  trust: OMDALA_PAGES.trust,
  vision: OMDALA_PAGES.vision,
  faq: OMDALA_PAGES.faq,
  contact: OMDALA_PAGES.contact,
};

export function resolveBilingualLocale(
  language: OmdalaLanguage | BilingualLocale,
): BilingualLocale {
  return language === "vi" ? "vi" : "en";
}

export function isBilingualLanguage(
  language: OmdalaLanguage | BilingualLocale,
): language is BilingualLocale {
  return language === "en" || language === "vi";
}

export function getBilingualSiteCopy(language: OmdalaLanguage | BilingualLocale) {
  return SOURCE[resolveBilingualLocale(language)];
}

export function getBrandLogoAlt(language: OmdalaLanguage | BilingualLocale) {
  return getBilingualSiteCopy(language).site.brandLogoAlt;
}

export function getChromeCopy(language: OmdalaLanguage | BilingualLocale) {
  return getBilingualSiteCopy(language).site.chrome;
}

export function getNotFoundCopy(language: OmdalaLanguage | BilingualLocale) {
  return getBilingualSiteCopy(language).site.notFound;
}

export function getPageCopy(
  pageKey: BilingualPageKey,
  language: OmdalaLanguage | BilingualLocale,
) {
  return getBilingualSiteCopy(language).pages[pageKey];
}

export function getPublicPageBodyCopy<K extends BilingualPublicPageKey>(
  pageKey: K,
  language: OmdalaLanguage | BilingualLocale,
) {
  return getBilingualSiteCopy(language).publicPages[pageKey];
}

export function getPagePath(pageKey: BilingualPageKey) {
  return PAGE_PATHS[pageKey];
}

export function getStaticSeoHeadProps(
  pageKey: BilingualPageKey,
  language: OmdalaLanguage | BilingualLocale = "en",
) {
  const home = getPageCopy("home", language);
  const page = getPageCopy(pageKey, language);
  const path = getPagePath(pageKey);

  return {
    title: page.seoTitle,
    description: page.seoDescription,
    path,
    breadcrumbs:
      pageKey === "home"
        ? [{ name: home.breadcrumbLabel, url: buildSeoUrl(path) }]
        : [
            { name: home.breadcrumbLabel, url: buildSeoUrl(PAGE_PATHS.home) },
            { name: page.breadcrumbLabel, url: buildSeoUrl(path) },
          ],
  };
}
