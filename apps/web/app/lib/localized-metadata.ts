import type { Metadata } from "next";
import { withLanguagePath, type OmdalaLanguage } from "@omdala/core";
import { buildLanguageAlternates, buildMetadata } from "@omdala/seo";
import {
  getPageCopy,
  getPagePath,
  resolveBilingualLocale,
  type BilingualPageKey,
  type BilingualLocale,
} from "./bilingual-source";
import { WEB_BILINGUAL_LANGUAGES } from "./locale-routing";

const OPEN_GRAPH_LOCALE: Record<BilingualLocale, string> = {
  en: "en_US",
  vi: "vi_VN",
};

export function buildLocalizedMetadata(
  pageKey: BilingualPageKey,
  language: OmdalaLanguage,
): Metadata {
  const bilingualLanguage = resolveBilingualLocale(language);
  const localizedPath = withLanguagePath(getPagePath(pageKey), bilingualLanguage);
  const page = getPageCopy(pageKey, bilingualLanguage);

  return buildMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    path: localizedPath,
    locale: OPEN_GRAPH_LOCALE[bilingualLanguage],
    alternateLanguages: buildLanguageAlternates(localizedPath, {
      locales: WEB_BILINGUAL_LANGUAGES,
    }),
  });
}
