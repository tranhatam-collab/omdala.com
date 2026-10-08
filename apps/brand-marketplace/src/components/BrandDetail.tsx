import Link from "next/link";
import type { PublicListingDTO } from "@omdala/brand-core";
import { formatUsd, infoHref, localize, marketCopy, type MarketplaceLocale } from "@/lib/locale";

const detailCopy = {
  en: {
    back: "All approved brands",
    about: "Brand summary",
    assets: "Included assets",
    excluded: "Not included",
    verification: "Verification summary",
    valuation: "Valuation estimate",
    transfer: "Transfer conditions",
    actions: "Start a managed inquiry",
    requestInfo: "Request more information",
    inquiry: "Make inquiry",
    offer: "Submit offer",
    proof: "Request proof access",
    room: "Open deal room",
    included: "Included",
    excludedLabel: "Excluded",
    confidence: "Confidence",
    drivers: "Drivers",
    risks: "Risks",
    transferIncludes: "Transfer includes",
    transferExcludes: "Transfer does not include",
    status: "Listing status",
  },
  vi: {
    back: "Tất cả thương hiệu đã duyệt",
    about: "Tóm tắt thương hiệu",
    assets: "Tài sản đi kèm",
    excluded: "Không bao gồm",
    verification: "Tóm tắt xác minh",
    valuation: "Ước tính định giá",
    transfer: "Điều kiện chuyển nhượng",
    actions: "Bắt đầu yêu cầu có quản lý",
    requestInfo: "Yêu cầu thêm thông tin",
    inquiry: "Gửi yêu cầu",
    offer: "Gửi đề nghị",
    proof: "Yêu cầu quyền xem proof",
    room: "Mở deal room",
    included: "Bao gồm",
    excludedLabel: "Không bao gồm",
    confidence: "Độ tin cậy",
    drivers: "Yếu tố tạo giá trị",
    risks: "Rủi ro",
    transferIncludes: "Chuyển nhượng bao gồm",
    transferExcludes: "Chuyển nhượng không bao gồm",
    status: "Trạng thái niêm yết",
  },
} as const;

function inquiryHref(locale: MarketplaceLocale, slug: string, intent: string): string {
  return `/${locale}/brands/${slug}/inquiry?intent=${intent}`;
}

export function BrandDetail({ listing, locale }: { listing: PublicListingDTO; locale: MarketplaceLocale }) {
  const copy = detailCopy[locale];
  const labels = marketCopy[locale];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.name,
    description: localize(listing.description, locale),
    category: listing.category.name,
    url: `https://brand.omdala.com/${locale}/brands/${listing.slug}`,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Listing tier", value: listing.tier },
      { "@type": "PropertyValue", name: "Verification", value: listing.verificationBadges.join(", ") },
    ],
  };

  return (
    <main className="market-detail" lang={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Link className="market-back-link" href={`/${locale}/brands`}>
        &larr; {copy.back}
      </Link>
      <section className="market-detail__hero">
        <div>
          <p className="market-eyebrow">{listing.category.name} / {listing.tier}</p>
          <h1>{listing.name}</h1>
          <p className="market-detail__tagline">{listing.tagline}</p>
        </div>
        <aside className="market-detail__terms" aria-label={locale === "en" ? "Listing terms" : "Điều khoản niêm yết"}>
          <span>{copy.status}</span>
          <strong>{listing.status.replace(/_/g, " ")}</strong>
          {listing.askingPriceUsd !== undefined ? (
            <>
              <span>{labels.price}</span>
              <strong>{formatUsd(listing.askingPriceUsd, locale)}</strong>
            </>
          ) : null}
          <p>{listing.inquiryOnly ? labels.inquiryOnly : labels.inquiryRequired}</p>
        </aside>
      </section>

      <section className="market-detail__section">
        <p className="market-eyebrow">01 / {copy.about}</p>
        <h2>{locale === "en" ? "A package, not just a name." : "Một gói tài sản, không chỉ một cái tên."}</h2>
        <p>{localize(listing.description, locale)}</p>
      </section>

      <section className="market-detail__section">
        <p className="market-eyebrow">02 / {copy.assets}</p>
        <h2>{copy.assets}</h2>
        <div className="asset-table-wrap">
          <table className="asset-table">
            <thead><tr><th>Asset</th><th>{copy.included}</th><th>{copy.verification}</th></tr></thead>
            <tbody>
              {listing.assets.map((asset) => (
                <tr key={`${asset.type}-${asset.inclusion}`}>
                  <td>{asset.type.replace(/_/g, " ")}</td>
                  <td>{asset.inclusion === "included" ? copy.included : copy.excludedLabel}</td>
                  <td>{asset.verification.replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {listing.excludedAssets.length > 0 ? <p className="market-muted"><strong>{copy.excluded}:</strong> {listing.excludedAssets.join(", ").replace(/_/g, " ")}</p> : null}
      </section>

      <section className="market-detail__section market-detail__two-column">
        <div>
          <p className="market-eyebrow">03 / {copy.verification}</p>
          <h2>{copy.verification}</h2>
          <ul className="verification-list">
            {listing.verificationBadges.map((badge) => <li key={badge}>{badge.replace(/_/g, " ")}</li>)}
          </ul>
          <Link className="market-link-arrow" href={infoHref(locale, locale === "en" ? "verification" : "xac-minh")}>
            {labels.verifiedAssets} <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        {listing.valuationEstimate ? (
          <div>
            <p className="market-eyebrow">04 / {copy.valuation}</p>
            <h2>{formatUsd(listing.valuationEstimate.rangeLowUsd, locale)} - {formatUsd(listing.valuationEstimate.rangeHighUsd, locale)}</h2>
            <p><strong>{copy.confidence}:</strong> {listing.valuationEstimate.confidence}</p>
            <p><strong>{copy.drivers}:</strong> {listing.valuationEstimate.drivers.join(", ")}</p>
            <p><strong>{copy.risks}:</strong> {listing.valuationEstimate.risks.join(", ")}</p>
            <p className="market-muted">{listing.valuationEstimate.label}</p>
          </div>
        ) : null}
      </section>

      {listing.transferConditions ? (
        <section className="market-detail__section market-detail__two-column">
          <div>
            <p className="market-eyebrow">05 / {copy.transfer}</p>
            <h2>{copy.transferIncludes}</h2>
            <ul>{listing.transferConditions.includes.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <p className="market-eyebrow">Boundary</p>
            <h2>{copy.transferExcludes}</h2>
            <ul>{listing.transferConditions.doesNotInclude.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </section>
      ) : null}

      <section className="market-inquiry-panel">
        <p className="market-eyebrow">06 / {copy.actions}</p>
        <h2>{locale === "en" ? "Begin with an accountable request." : "Bắt đầu bằng một yêu cầu có trách nhiệm."}</h2>
        <p>{labels.noCheckout}</p>
        <div className="market-actions">
          <Link className="market-button market-button--solid" href={inquiryHref(locale, listing.slug, "request_info")}>{copy.requestInfo}</Link>
          <Link className="market-button market-button--quiet" href={inquiryHref(locale, listing.slug, "submit_offer")}>{copy.offer}</Link>
          <Link className="market-button market-button--quiet" href={inquiryHref(locale, listing.slug, "request_proof_access")}>{copy.proof}</Link>
          <Link className="market-button market-button--quiet" href={inquiryHref(locale, listing.slug, "open_deal_room")}>{copy.room}</Link>
        </div>
        <Link className="market-text-link" href={inquiryHref(locale, listing.slug, "make_inquiry")}>{copy.inquiry}</Link>
      </section>
    </main>
  );
}
