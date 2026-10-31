"use client";

import { resolveLanguage, withLanguageParam } from "@omdala/core";
import { notifyLocationChange, useLocationSearchParam, useLocationSuffix } from "@omdala/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
] as const;

export function LanguageSwitcher() {
  const pathname = usePathname();
  const currentLanguage = resolveLanguage(useLocationSearchParam("lang"));
  // Keep every other query parameter and the hash (for example ?next=).
  const currentPath = `${pathname}${useLocationSuffix()}`;

  return (
    <div className="auth-language-switcher" aria-label="Language selector">
      {LANGUAGES.map(({ code, label }) => (
        <Link
          key={code}
          href={withLanguageParam(currentPath, code)}
          onClick={() => window.setTimeout(notifyLocationChange, 0)}
          aria-current={currentLanguage === code ? "true" : undefined}
          className={`auth-language-switcher__item${currentLanguage === code ? " auth-language-switcher__item--active" : ""}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
