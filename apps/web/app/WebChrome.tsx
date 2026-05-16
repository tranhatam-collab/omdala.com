import {
  ANGEL_EDU_TAM_FOUNDATION,
  type OmdalaLanguage,
} from "@omdala/core";
import { OMDALA_PAGES } from "@omdala/seo";
import Image from "next/image";
import { LocaleLink } from "./components/LocaleLink";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import {
  getBrandLogoAlt,
  getChromeCopy,
} from "./lib/bilingual-source";

const primaryNavigation = [
  { key: "what", href: OMDALA_PAGES.whatIsOmdala },
  { key: "how", href: OMDALA_PAGES.howItWorks },
  { key: "experts", href: OMDALA_PAGES.forExperts },
  { key: "hosts", href: OMDALA_PAGES.forHosts },
  { key: "communities", href: OMDALA_PAGES.forCommunities },
  { key: "trust", href: OMDALA_PAGES.trust },
  { key: "vision", href: OMDALA_PAGES.vision },
] as const;

export function WebChrome({
  children,
  language,
}: {
  children: React.ReactNode;
  language: OmdalaLanguage;
}) {
  const text = getChromeCopy(language);

  return (
    <>
      <header className="site-header">
        <div className="site-shell site-header__inner">
          <LocaleLink
            href={OMDALA_PAGES.home}
            language={language}
            className="brand-mark"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Image
              src="/logo.svg"
              alt={getBrandLogoAlt(language)}
              width={24}
              height={24}
              className="brand-icon"
            />
            <span>OMDALA</span>
          </LocaleLink>

          <nav className="site-nav" aria-label={text.primaryNavAriaLabel}>
            {primaryNavigation.map((item) => (
              <LocaleLink key={item.href} href={item.href} language={language}>
                {text.nav[item.key]}
              </LocaleLink>
            ))}
          </nav>

          <div className="site-header__actions">
            <LanguageSwitcher ariaLabel={text.labels.languageSwitcher} />
            <a
              href={`https://app.omdala.com${language === "en" ? "" : `?lang=${language}`}`}
              className="site-button site-button--ghost"
            >
              {text.enterApp}
            </a>
          </div>
        </div>
      </header>

      {children}

      <footer className="site-footer">
        <div className="site-shell footer-grid">
          <div className="footer-block">
            <p className="eyebrow">{text.footerEyebrow}</p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <Image
                src="/logo.svg"
                alt={getBrandLogoAlt(language)}
                width={24}
                height={24}
              />
              <h2>OMDALA</h2>
            </div>
            <p className="section-copy">{text.footerLead}</p>
          </div>

          <div className="footer-block">
            <p className="footer-heading">{text.sections.platform}</p>
            <LocaleLink href={OMDALA_PAGES.whatIsOmdala} language={language}>
              {text.links.whatIsOmdala}
            </LocaleLink>
            <LocaleLink href={OMDALA_PAGES.howItWorks} language={language}>
              {text.links.howItWorks}
            </LocaleLink>
            <LocaleLink href={OMDALA_PAGES.trust} language={language}>
              {text.links.trustArchitecture}
            </LocaleLink>
          </div>

          <div className="footer-block">
            <p className="footer-heading">{text.sections.surfaces}</p>
            <a href="https://app.omdala.com">{text.links.app}</a>
            <a href="https://docs.omdala.com">{text.links.docs}</a>
            <a href="https://api.omdala.com/health">{text.links.apiHealth}</a>
          </div>

          <div className="footer-block">
            <p className="footer-heading">{text.sections.legal}</p>
            <p className="section-copy">{ANGEL_EDU_TAM_FOUNDATION.legalName}</p>
            <p className="section-copy">
              <span className="footer-legal-label">{text.labels.legalEmail}</span>{" "}
              <a href={`mailto:${ANGEL_EDU_TAM_FOUNDATION.email}`}>
                {ANGEL_EDU_TAM_FOUNDATION.email}
              </a>
            </p>
            <p className="section-copy">
              <span className="footer-legal-label">{text.labels.legalWeb}</span>{" "}
              <a
                href={ANGEL_EDU_TAM_FOUNDATION.websiteUrl}
                rel="noopener noreferrer"
              >
                {ANGEL_EDU_TAM_FOUNDATION.websiteDisplay}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
