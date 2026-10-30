"use client";

import { getLanguageFromPath, withLanguagePath } from "@omdala/core";
import { notifyLocationChange, useLocationSuffix } from "@omdala/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
] as const;

export function LanguageSwitcher() {
  const pathname = usePathname() ?? "/";
  const currentLanguage = getLanguageFromPath(pathname);
  // Keep every other query parameter and the hash when switching language.
  const current = `${pathname}${useLocationSuffix()}`;

  return (
    <div className="docs-language-switcher" aria-label="Language selector">
      {LANGUAGES.map(({ code, label }) => {
        const isActive = currentLanguage === code;
        return (
          <Link
            key={code}
            href={withLanguagePath(current, code)}
            onClick={() => window.setTimeout(notifyLocationChange, 0)}
            aria-current={isActive ? "true" : undefined}
            hrefLang={code}
            className={`docs-language-switcher__item${isActive ? " docs-language-switcher__item--active" : ""}`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
