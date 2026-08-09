import Link from "next/link";
import { BRAND_CATEGORIES } from "@omdala/brand-core";
import { ListingCard } from "@/components/ListingCard";
import { categoryHref, infoHref, localize, marketCopy, type MarketplaceLocale } from "@/lib/locale";
import { getListings } from "@/lib/listings";

const homeCopy = {
  en: {
    eyebrow: "Private inventory / Global-first",
    title: "Acquire a digital brand with the evidence attached.",
    body: "OMDALA Brand Exchange presents approved private inventory with clear asset boundaries, public verification summaries, and a managed transfer path.",
    primary: "Browse brand packages",
    secondary: "How the exchange works",
    featured: "Featured private inventory",
    categoryLead: "Explore by operating surface, not by hype.",
    trustTitle: "The public layer stops before the sensitive layer.",
    trustBody: "Sensitive proof, buyer qualification, and transfer execution remain in the authenticated OMDALA workspace.",
  },
  vi: {
    eyebrow: "Private inventory / Global-first",
    title: "Sở hữu thương hiệu số với hồ sơ bằng chứng rõ ràng.",
    body: "OMDALA Brand Exchange giới thiệu private inventory đã được duyệt, nêu rõ phạm vi tài sản, tóm tắt xác minh công khai và lộ trình chuyển nhượng có quản lý.",
    primary: "Xem gói thương hiệu",
    secondary: "Cách sàn hoạt động",
    featured: "Private inventory nổi bật",
    categoryLead: "Khám phá theo bề mặt vận hành, không theo lời quảng cáo.",
    trustTitle: "Lớp công khai dừng trước lớp dữ liệu nhạy cảm.",
    trustBody: "Proof nhạy cảm, xác thực buyer và thực thi chuyển nhượng đều ở workspace OMDALA có xác thực.",
  },
} as const;

export function MarketplaceHome({ locale }: { locale: MarketplaceLocale }) {
  const copy = homeCopy[locale];
  const labels = marketCopy[locale];
  const listings = getListings();

  return (
    <main lang={locale}>
      <section className="market-hero">
        <p className="market-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="market-hero__body">{copy.body}</p>
        <div className="market-actions">
          <Link className="market-button market-button--solid" href={`/${locale}/brands`}>
            {copy.primary}
          </Link>
          <Link className="market-button market-button--quiet" href={infoHref(locale, locale === "en" ? "how-it-works" : "cach-hoat-dong")}>
            {copy.secondary}
          </Link>
        </div>
        <p className="market-phase-note">{labels.noCheckout}</p>
      </section>

      <section className="market-section market-section--categories" aria-labelledby="categories-title">
        <div className="market-section__heading">
          <p className="market-eyebrow">{labels.categories}</p>
          <h2 id="categories-title">{copy.categoryLead}</h2>
        </div>
        <div className="category-rail">
          {BRAND_CATEGORIES.map((category, index) => (
            <Link className="category-rail__item" href={categoryHref(locale, category.slug)} key={category.id}>
              <span>0{index + 1}</span>
              <strong>{category.name}</strong>
              <small>{localize(category.description, locale)}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="market-section" aria-labelledby="featured-title">
        <div className="market-section__heading market-section__heading--inline">
          <div>
            <p className="market-eyebrow">{copy.featured}</p>
            <h2 id="featured-title">{locale === "en" ? "A smaller catalog. A clearer handoff." : "Danh mục chọn lọc. Bàn giao rõ ràng."}</h2>
          </div>
          <Link className="market-link-arrow" href={`/${locale}/brands`}>
            {labels.brandIndex} <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <div className="listing-grid">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} locale={locale} />
          ))}
        </div>
      </section>

      <section className="market-trust-callout">
        <p className="market-eyebrow">{locale === "en" ? "Trust boundary" : "Ranh giới tin cậy"}</p>
        <h2>{copy.trustTitle}</h2>
        <p>{copy.trustBody}</p>
        <Link className="market-link-arrow" href={infoHref(locale, locale === "en" ? "verification" : "xac-minh")}>
          {labels.verifiedAssets} <span aria-hidden="true">&rarr;</span>
        </Link>
      </section>
    </main>
  );
}
