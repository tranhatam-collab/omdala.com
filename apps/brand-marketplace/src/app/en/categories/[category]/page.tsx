import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND_CATEGORIES } from "@omdala/brand-core";
import { ListingCard } from "@/components/ListingCard";
import { getListingsByCategory } from "@/lib/listings";

export function generateStaticParams() { return BRAND_CATEGORIES.map((category) => ({ category: category.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = BRAND_CATEGORIES.find((item) => item.slug === slug);
  return category ? { title: `${category.name} brand packages` } : { title: "Brand category" };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = BRAND_CATEGORIES.find((item) => item.slug === slug);
  if (!category) notFound();
  const listings = getListingsByCategory(category.id);
  return <main className="market-information" lang="en"><header><p className="market-eyebrow">Category / {category.name}</p><h1>{category.name} brand packages</h1><p className="market-information__lead">{category.description.en}</p></header><div className="listing-grid market-listing-index">{listings.length ? listings.map((listing) => <ListingCard key={listing.id} listing={listing} locale="en" />) : <p className="market-information__lead">No approved private inventory is published in this category yet.</p>}</div></main>;
}
