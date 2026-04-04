"use client";

import {
  resolveLanguage,
  type OmdalaLanguage,
  withLanguageParam,
} from "@omdala/core";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";
import { useEffect, useState } from "react";

type LocaleLinkProps = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
    LinkProps & {
      href: string;
    }
>;

export function LocaleLink({ href, children, ...props }: LocaleLinkProps) {
  const pathname = usePathname();
  const [language, setLanguage] = useState<OmdalaLanguage>("en");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const lang = resolveLanguage(
      new URLSearchParams(window.location.search).get("lang"),
    );
    setLanguage(lang);
  }, [pathname]);

  useEffect(() => {
    function handleLanguageChanged(event: Event) {
      const customEvent = event as CustomEvent<{ language?: OmdalaLanguage }>;
      const nextLanguage = customEvent.detail?.language;
      if (nextLanguage) {
        setLanguage(resolveLanguage(nextLanguage));
      }
    }

    window.addEventListener("omdala:language-changed", handleLanguageChanged);
    return () =>
      window.removeEventListener(
        "omdala:language-changed",
        handleLanguageChanged,
      );
  }, []);

  const localizedHref = withLanguageParam(href, language);

  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  );
}
