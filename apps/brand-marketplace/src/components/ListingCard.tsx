import Link from "next/link";
import type { PublicListingDTO } from "@omdala/brand-core";
import { formatUsd, listingHref, marketCopy, type MarketplaceLocale } from "@/lib/locale";

export function ListingCard({ listing, locale }: { listing: PublicListingDTO; locale: MarketplaceLocale }) {
  const copy = marketCopy[locale];

  return (
    <article className="listing-card">
      <div className="listing-card__topline">
        <span>{listing.category.name}</span>
        <span>{listing.tier}</span>
      </div>
      <h3>
        <Link href={listingHref(locale, listing.slug)}>{listing.name}</Link>
      </h3>
      <p>{listing.tagline}</p>
      <div className="listing-card__price">
        {listing.askingPriceUsd !== undefined ? (
          <>
            <span>{copy.price}</span>
            <strong>{formatUsd(listing.askingPriceUsd, locale)}</strong>
          </>
        ) : (
          <strong>{copy.inquiryOnly}</strong>
        )}
      </div>
      <p className="listing-card__notice">{listing.inquiryOnly ? copy.inquiryOnly : copy.inquiryRequired}</p>
      <ul className="listing-card__badges" aria-label={locale === "en" ? "Verification badges" : "Huy hiệu xác minh"}>
        {listing.verificationBadges.slice(0, 3).map((badge) => (
          <li key={badge}>{badge.replace(/_/g, " ")}</li>
        ))}
      </ul>
      <Link className="market-link-arrow" href={listingHref(locale, listing.slug)}>
        {copy.viewListing} <span aria-hidden="true">&rarr;</span>
      </Link>
    </article>
  );
}
