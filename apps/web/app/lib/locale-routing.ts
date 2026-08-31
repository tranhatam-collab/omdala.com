import {
  OMDALA_DEFAULT_LANGUAGE,
  resolveLanguage,
  type OmdalaLanguage,
} from "@omdala/core";

export const WEB_BILINGUAL_LANGUAGES = ["en", "vi"] as const satisfies readonly OmdalaLanguage[];

export const OMDALA_PREFIXED_LANGUAGES = WEB_BILINGUAL_LANGUAGES.filter(
  (language) => language !== OMDALA_DEFAULT_LANGUAGE,
);

export function getPrefixedLocaleStaticParams() {
  return OMDALA_PREFIXED_LANGUAGES.map((lang) => ({ lang }));
}

export function resolveRouteLanguage(value: string | undefined): OmdalaLanguage {
  const language = resolveLanguage(value);
  return WEB_BILINGUAL_LANGUAGES.includes(
    language as (typeof WEB_BILINGUAL_LANGUAGES)[number],
  )
    ? language
    : OMDALA_DEFAULT_LANGUAGE;
}
