import Link from "next/link";
import { infoHref, marketCopy, type MarketplaceLocale } from "@/lib/locale";

export function MarketplaceNav({ locale }: { locale: MarketplaceLocale }) {
  const copy = marketCopy[locale];
  const alternateLocale = locale === "en" ? "vi" : "en";

  return (
    <header className="market-nav-wrap">
      <nav className="market-nav" aria-label={locale === "en" ? "Brand Exchange navigation" : "Điều hướng Brand Exchange"}>
        <Link className="market-wordmark" href={`/${locale}`}>
          <span>OMDALA</span>
          <small>Brand Exchange</small>
        </Link>
        <div className="market-nav__links">
          <Link href={`/${locale}/brands`}>{copy.brandIndex}</Link>
          <Link href={`/${locale}/categories`}>{copy.categories}</Link>
          <Link href={infoHref(locale, locale === "en" ? "buy" : "mua-ban-thuong-hieu")}>{copy.buy}</Link>
          <Link href={infoHref(locale, locale === "en" ? "sell" : "ban-thuong-hieu-so")}>{copy.sell}</Link>
        </div>
        <Link className="market-locale-switch" href={`/${alternateLocale}`} hrefLang={alternateLocale} lang={alternateLocale}>
          {locale === "en" ? "VI" : "EN"}
        </Link>
      </nav>
    </header>
  );
}
