"use client";

import {
  getLanguageFromPath,
  stripLanguageFromPath,
  withLanguagePath,
} from "@omdala/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { WEB_BILINGUAL_LANGUAGES } from "../lib/locale-routing";

type WebBilingualLanguage = (typeof WEB_BILINGUAL_LANGUAGES)[number];

const LANGUAGE_CONFIG: Record<WebBilingualLanguage, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  vi: { label: "Tiếng Việt", flag: "🇻🇳" },
};

export function LanguageSwitcher({ ariaLabel }: { ariaLabel?: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentPath = pathname ?? "/";
  const currentLanguage = useMemo(
    () => getLanguageFromPath(currentPath),
    [currentPath],
  );
  const basePath = useMemo(
    () => stripLanguageFromPath(currentPath),
    [currentPath],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentConfig =
    LANGUAGE_CONFIG[currentLanguage as WebBilingualLanguage] || LANGUAGE_CONFIG.en;

  return (
    <div className="language-dropdown" ref={dropdownRef}>
      <button
        className="language-dropdown__toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={ariaLabel ?? "Change language"}
      >
        <span className="language-dropdown__flag">{currentConfig.flag}</span>
        <span className="language-dropdown__code">
          {currentLanguage.toUpperCase()}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown__menu">
          {WEB_BILINGUAL_LANGUAGES.map((language) => {
            const href = withLanguagePath(basePath, language);
            const isActive = currentLanguage === language;
            const config = LANGUAGE_CONFIG[language];

            return (
              <Link
                key={language}
                href={href}
                className={`language-dropdown__item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                <span className="language-dropdown__flag">{config.flag}</span>
                <span className="language-dropdown__label">{config.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
