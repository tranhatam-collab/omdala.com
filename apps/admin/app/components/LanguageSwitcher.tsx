"use client";

import {
  isReadyLanguage,
  OMDALA_LANGUAGES,
  resolveLanguage,
  withLanguageParam,
} from "@omdala/core";
import {
  notifyLocationChange,
  pickBilingualValue,
  SHARED_UI_COPY,
  useLocationSearchParam,
} from "@omdala/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LANGUAGE_LABELS: Record<(typeof OMDALA_LANGUAGES)[number], string> = {
  en: "EN",
  vi: "VI",
  zh: "ZH",
  es: "ES",
  ja: "JA",
  ko: "KO",
};

export function LanguageSwitcher() {
  const pathname = usePathname();
  const currentLanguage = resolveLanguage(useLocationSearchParam("lang"));
  const currentPath = pathname;

  return (
    <div
      className="language-switcher"
      aria-label={pickBilingualValue(currentLanguage, SHARED_UI_COPY.languageSelectorAria)}
    >
      {OMDALA_LANGUAGES.map((language) => {
        const isReady = isReadyLanguage(language);
        const href = withLanguageParam(currentPath, language);
        const isActive = currentLanguage === language;

        if (!isReady) {
          return (
            <span
              key={language}
              className="language-switcher__item language-switcher__item--disabled"
              title={pickBilingualValue(currentLanguage, SHARED_UI_COPY.comingSoon)}
            >
              {LANGUAGE_LABELS[language]}
            </span>
          );
        }

        return (
          <Link
            key={language}
            href={href}
            onClick={() => window.setTimeout(notifyLocationChange, 0)}
            className={`language-switcher__item${isActive ? " language-switcher__item--active" : ""}`}
          >
            {LANGUAGE_LABELS[language]}
          </Link>
        );
      })}
    </div>
  );
}
