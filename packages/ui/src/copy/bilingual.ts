const OMDALA_LANGUAGES = ["en", "vi", "zh", "es", "ja", "ko"] as const;
const OMDALA_DEFAULT_LANGUAGE = "en" as const;

export type OmdalaLanguage = (typeof OMDALA_LANGUAGES)[number];
export type OmdalaLocalizedValue<T = string> = Record<OmdalaLanguage, T>;

export type BilingualValue<T = string> = {
  en: T;
  vi: T;
};

export type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

function toLocalizedValue<T>(value: BilingualValue<T>): OmdalaLocalizedValue<T> {
  return {
    en: value.en,
    vi: value.vi,
    zh: value.en,
    es: value.en,
    ja: value.en,
    ko: value.en,
  };
}

function pickLanguageValue<T>(
  language: OmdalaLanguage,
  values: OmdalaLocalizedValue<T>,
): T {
  return values[language];
}

function resolveLanguage(value: string | null | undefined): OmdalaLanguage {
  if (!value) {
    return OMDALA_DEFAULT_LANGUAGE;
  }

  return OMDALA_LANGUAGES.includes(value as OmdalaLanguage)
    ? (value as OmdalaLanguage)
    : OMDALA_DEFAULT_LANGUAGE;
}

export function pickBilingualValue<T>(
  language: OmdalaLanguage,
  value: BilingualValue<T>,
): T {
  return pickLanguageValue(language, toLocalizedValue(value));
}

export function resolveLanguageFromSearchParams(
  searchParams: SearchParamsInput,
): OmdalaLanguage {
  if (!searchParams) {
    return resolveLanguage(null);
  }

  if (searchParams instanceof URLSearchParams) {
    return resolveLanguage(searchParams.get("lang"));
  }

  const rawValue = searchParams.lang;
  if (Array.isArray(rawValue)) {
    return resolveLanguage(rawValue[0]);
  }

  return resolveLanguage(rawValue ?? null);
}
