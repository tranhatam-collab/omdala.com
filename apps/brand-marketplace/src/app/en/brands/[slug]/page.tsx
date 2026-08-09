import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandDetail } from "@/components/BrandDetail";
import { getListingBySlug, getListings } from "@/lib/listings";

export function generateStaticParams() { return getListings().map((listing) => ({ slug: listing.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  return listing ? { title: listing.name, description: listing.tagline } : { title: "Brand listing" };
}

export default async function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) notFound();
  return <BrandDetail listing={listing} locale="en" />;
}
