import type { Metadata } from "next";
import { MARKETPLACE_ORIGIN, type MarketplaceLocale } from "./locale";

export const allowIndexing =
  process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT === "production" &&
  process.env.OMDALA_NOINDEX !== "true";

export function localeUrl(locale: MarketplaceLocale, path: string): string {
  const clean = path === "/" ? "" : path.replace(/\/+$/g, "");
  return `${MARKETPLACE_ORIGIN}/${locale}${clean}/`;
}

/** Canonical plus EN/VI/x-default alternates, for pages that exist in both languages. */
export function localizedAlternates(locale: MarketplaceLocale, path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localeUrl(locale, path),
    languages: { en: localeUrl("en", path), vi: localeUrl("vi", path), "x-default": localeUrl("en", path) },
  };
}

/** A self canonical only, for pages whose slug has no counterpart in the other language. */
export function selfAlternates(locale: MarketplaceLocale, path: string): NonNullable<Metadata["alternates"]> {
  return { canonical: localeUrl(locale, path) };
}

export function rootMetadata(locale: MarketplaceLocale): Metadata {
  return {
    metadataBase: new URL(MARKETPLACE_ORIGIN),
    title: {
      default: "OMDALA Brand Exchange",
      template: "%s | OMDALA Brand Exchange",
    },
    description:
      locale === "vi"
        ? "Kho thương hiệu số riêng tư đã được phê duyệt và xác minh."
        : "Approved private inventory for verified digital brand assets.",
    robots: { index: allowIndexing, follow: allowIndexing },
  };
}
