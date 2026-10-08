import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND_CATEGORIES } from "@omdala/brand-core";
import { ListingCard } from "@/components/ListingCard";
import { getListingsByCategory } from "@/lib/listings";

export function generateStaticParams() { return BRAND_CATEGORIES.map((category) => ({ category: category.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = BRAND_CATEGORIES.find((item) => item.slug === slug);
  return category ? { title: `Gói thương hiệu ${category.name}` } : { title: "Danh mục thương hiệu" };
}

export default async function VietnameseCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = BRAND_CATEGORIES.find((item) => item.slug === slug);
  if (!category) notFound();
  const listings = getListingsByCategory(category.id);
  return <main className="market-information" lang="vi"><header><p className="market-eyebrow">Danh mục / {category.name}</p><h1>Gói thương hiệu {category.name}</h1><p className="market-information__lead">{category.description.vi}</p></header><div className="listing-grid market-listing-index">{listings.length ? listings.map((listing) => <ListingCard key={listing.id} listing={listing} locale="vi" />) : <p className="market-information__lead">Chưa có tài sản private inventory được duyệt trong danh mục này.</p>}</div></main>;
}
