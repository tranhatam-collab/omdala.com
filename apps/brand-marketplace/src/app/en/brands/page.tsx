import type { Metadata } from "next";
import { ListingCard } from "@/components/ListingCard";
import { getListings } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Approved brand packages",
  description: "Browse approved private inventory for verified digital brand assets.",
};

export default function BrandsPage() {
  const listings = getListings();
  return (
    <main className="market-information" lang="en">
      <header><p className="market-eyebrow">Approved private inventory</p><h1>Brand packages with explicit handoff boundaries.</h1><p className="market-information__lead">Every public listing names its tier, asset scope, and public verification summary. Sensitive evidence remains private.</p></header>
      <div className="listing-grid market-listing-index">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} locale="en" />)}</div>
    </main>
  );
}
