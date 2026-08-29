"use client";

import { resolveLanguage, type OmdalaLanguage } from "@omdala/core";
import { useLocationSearchParam } from "@omdala/ui";
import { useEffect, useState } from "react";

export function useWebLocale(): OmdalaLanguage {
  const queryLocale = resolveLanguage(useLocationSearchParam("lang"));
  const [eventLocale, setEventLocale] = useState<OmdalaLanguage | null>(null);

  useEffect(() => {
    function handleLanguageChanged(event: Event) {
      const customEvent = event as CustomEvent<{ language?: OmdalaLanguage }>;
      const nextLanguage = customEvent.detail?.language;
      if (nextLanguage) {
        setEventLocale(resolveLanguage(nextLanguage));
      }
    }

    window.addEventListener("omdala:language-changed", handleLanguageChanged);
    return () =>
      window.removeEventListener(
        "omdala:language-changed",
        handleLanguageChanged,
      );
  }, []);

  return eventLocale ?? queryLocale;
}
