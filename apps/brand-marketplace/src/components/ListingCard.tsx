import Link from "next/link";
import type { PublicListingDTO } from "@omdala/brand-core";
import { formatUsd, listingHref, marketCopy, type MarketplaceLocale } from "@/lib/locale";

export function ListingCard({
  listing,
  locale,
  headingLevel = 3,
}: {
  listing: PublicListingDTO;
  locale: MarketplaceLocale;
  /** 2 when the card sits directly under the page h1; 3 under a section h2. */
  headingLevel?: 2 | 3;
}) {
  const copy = marketCopy[locale];
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article className="listing-card">
      <div className="listing-card__topline">
        <span>{listing.category.name}</span>
        <span>{listing.tier}</span>
      </div>
      <Heading>
        <Link href={listingHref(locale, listing.slug)}>{listing.name}</Link>
      </Heading>
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
