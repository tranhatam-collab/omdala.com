"use client";

import { useEffect } from "react";
import { useLocationSearchParam } from "../hooks/useLocationSearchParam";

const SUPPORTED_LANGUAGES = new Set(["en", "vi", "zh", "es", "ja", "ko"]);

type DocumentLanguageSyncProps = {
  language?: string;
};

function normalizeLanguage(language: string | null | undefined) {
  if (!language) {
    return "en";
  }

  return SUPPORTED_LANGUAGES.has(language) ? language : "en";
}

function resolveDocumentLanguage(language?: string) {
  if (language) {
    return normalizeLanguage(language);
  }

  if (typeof window === "undefined") {
    return "en";
  }

  const pathLanguage = window.location.pathname.split("/").filter(Boolean)[0];
  if (pathLanguage && SUPPORTED_LANGUAGES.has(pathLanguage)) {
    return pathLanguage;
  }

  const queryLanguage = new URLSearchParams(window.location.search).get("lang");
  return normalizeLanguage(queryLanguage);
}

export function DocumentLanguageSync({ language }: DocumentLanguageSyncProps) {
  // Re-sync on client-side ?lang= changes, not only on first mount.
  const queryLanguage = useLocationSearchParam("lang");

  useEffect(() => {
    const nextLanguage = resolveDocumentLanguage(language);
    document.documentElement.lang = nextLanguage;
  }, [language, queryLanguage]);

  return null;
}
