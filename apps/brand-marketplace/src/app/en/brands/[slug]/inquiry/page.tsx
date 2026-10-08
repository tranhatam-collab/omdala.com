import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  InquiryHandoff,
  InquiryHandoffFallback,
} from "@/components/InquiryHandoff";
import { getListingBySlug, getListings } from "@/lib/listings";
import { getAppWorkspaceOrigin } from "@/lib/runtime-origins";

export const dynamicParams = false;
export const metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return getListings().map((listing) => ({ slug: listing.slug }));
}

export default async function InquiryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) notFound();
  const props = {
    appOrigin: getAppWorkspaceOrigin(),
    listingName: listing.name,
    locale: "en" as const,
    slug,
  };
  return (
    <Suspense fallback={<InquiryHandoffFallback {...props} />}>
      <InquiryHandoff {...props} />
    </Suspense>
  );
}
