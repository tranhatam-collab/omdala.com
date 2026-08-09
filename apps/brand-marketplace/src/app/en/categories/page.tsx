import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_CATEGORIES } from "@omdala/brand-core";
import { categoryHref, localize } from "@/lib/locale";

export const metadata: Metadata = { title: "Brand categories" };

export default function CategoriesPage() {
  return (
    <main className="market-information" lang="en">
      <header><p className="market-eyebrow">Inventory map</p><h1>Explore by operating surface.</h1><p className="market-information__lead">Categories organize approved private inventory without making a claim that every category is currently populated.</p></header>
      <div className="category-rail market-category-index">
        {BRAND_CATEGORIES.map((category, index) => <Link className="category-rail__item" href={categoryHref("en", category.slug)} key={category.id}><span>0{index + 1}</span><strong>{category.name}</strong><small>{localize(category.description, "en")}</small></Link>)}
      </div>
    </main>
  );
}
