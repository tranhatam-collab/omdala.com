"use client";

import {
  isReadyLanguage,
  OMDALA_LANGUAGES,
  resolveLanguage,
  withLanguageParam,
} from "@omdala/core";
import { notifyLocationChange, useLocationSearchParam } from "@omdala/ui";
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
    <div className="docs-language-switcher" aria-label="Language selector">
      {OMDALA_LANGUAGES.map((language) => {
        const isReady = isReadyLanguage(language);
        const href = withLanguageParam(currentPath, language);
        const isActive = currentLanguage === language;

        if (!isReady) {
          return (
            <span
              key={language}
              className="docs-language-switcher__item docs-language-switcher__item--disabled"
              title="Coming soon"
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
            className={`docs-language-switcher__item${isActive ? " docs-language-switcher__item--active" : ""}`}
          >
            {LANGUAGE_LABELS[language]}
          </Link>
        );
      })}
    </div>
  );
}
