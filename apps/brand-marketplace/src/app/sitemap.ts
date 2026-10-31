import type { MetadataRoute } from "next";
import { BRAND_CATEGORIES } from "@omdala/brand-core";
import { informationPageSlugs } from "@/lib/information-pages";
import { getListings } from "@/lib/listings";
import type { MarketplaceLocale } from "@/lib/locale";
import { localeUrl } from "@/lib/seo";

export const dynamic = "force-static";

const LOCALES: MarketplaceLocale[] = ["en", "vi"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Pages that exist in both languages under the same path carry EN/VI alternates.
  const paired = ["/", "/brands", "/categories"];
  for (const listing of getListings()) paired.push(`/brands/${listing.slug}`);
  for (const category of BRAND_CATEGORIES) paired.push(`/categories/${category.slug}`);
  for (const path of paired) {
    const languages = { en: localeUrl("en", path), vi: localeUrl("vi", path), "x-default": localeUrl("en", path) };
    for (const locale of LOCALES) {
      entries.push({ url: localeUrl(locale, path), lastModified, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7, alternates: { languages } });
    }
  }

  // Information pages are slugged per language and have no counterpart URL.
  for (const locale of LOCALES) {
    for (const slug of informationPageSlugs(locale)) {
      entries.push({ url: localeUrl(locale, `/${slug}`), lastModified, changeFrequency: "monthly", priority: 0.5 });
    }
  }
  return entries;
}
