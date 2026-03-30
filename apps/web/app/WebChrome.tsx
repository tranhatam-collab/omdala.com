'use client'

import { ANGEL_EDU_TAM_FOUNDATION, resolveLanguage, type OmdalaLanguage } from '@omdala/core'
import { OMDALA_PAGES } from '@omdala/seo'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LocaleLink } from './components/LocaleLink'
import { LanguageSwitcher } from './components/LanguageSwitcher'

const COPY = {
  en: {
    nav: {
      what: 'What it is',
      how: 'How it works',
      experts: 'Experts',
      hosts: 'Hosts',
      communities: 'Communities',
      trust: 'Trust',
      vision: 'Vision',
    },
    enterApp: 'Enter App',
    footerEyebrow: 'Master Platform',
    footerLead:
      'The operating layer for real-world value, trust, and intelligent coordination.',
    platform: 'Platform',
    whatIsOmdala: 'What OMDALA is',
    trustArchitecture: 'Trust architecture',
    surfaces: 'Surfaces',
    apiHealth: 'API health',
    legalEntity: 'Legal entity',
    legalSponsor:
      'Angel Edu Tam Foundation Inc sponsors omdala.com, omdalat.com, and the *.iai.one ecosystem, including fully sponsored technology for omdalat.com. Official legal texts for IAI services: docs.iai.one/legal/.',
  },
  vi: {
    nav: {
      what: 'OMDALA là gì',
      how: 'Cách hệ thống vận hành',
      experts: 'Cho chuyên gia',
      hosts: 'Cho điểm đón',
      communities: 'Cho cộng đồng',
      trust: 'Niềm tin',
      vision: 'Tầm nhìn',
    },
    enterApp: 'Vào ứng dụng',
    footerEyebrow: 'Nền tảng chủ',
    footerLead:
      'Lớp vận hành cho giá trị đời thực, niềm tin và điều phối thông minh.',
    platform: 'Nền tảng',
    whatIsOmdala: 'OMDALA là gì',
    trustArchitecture: 'Kiến trúc niềm tin',
    surfaces: 'Bề mặt hệ thống',
    apiHealth: 'Trạng thái API',
    legalEntity: 'Pháp nhân tài trợ',
    legalSponsor:
      'Angel Edu Tam Foundation Inc tài trợ omdala.com, omdalat.com và hệ sinh thái *.iai.one; hỗ trợ công nghệ hoàn toàn miễn phí cho omdalat.com. Văn bản pháp lý chính thức cho dịch vụ IAI: docs.iai.one/legal/.',
  },
}

const primaryNavigation = [
  { key: 'what', href: OMDALA_PAGES.whatIsOmdala },
  { key: 'how', href: OMDALA_PAGES.howItWorks },
  { key: 'experts', href: OMDALA_PAGES.forExperts },
  { key: 'hosts', href: OMDALA_PAGES.forHosts },
  { key: 'communities', href: OMDALA_PAGES.forCommunities },
  { key: 'trust', href: OMDALA_PAGES.trust },
  { key: 'vision', href: OMDALA_PAGES.vision },
] as const

export function WebChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [language, setLanguage] = useState<OmdalaLanguage>('en')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const lang = resolveLanguage(new URLSearchParams(window.location.search).get('lang'))
    setLanguage(lang)
  }, [pathname])

  const text = COPY[language === 'vi' ? 'vi' : 'en']

  return (
    <>
      <header className="site-header">
        <div className="site-shell site-header__inner">
          <LocaleLink href={OMDALA_PAGES.home} className="brand-mark">
            OMDALA
          </LocaleLink>

          <nav className="site-nav" aria-label="Primary">
            {primaryNavigation.map((item) => (
              <LocaleLink key={item.href} href={item.href}>
                {text.nav[item.key]}
              </LocaleLink>
            ))}
          </nav>

          <div className="site-header__actions">
            <LanguageSwitcher />
            <a href="https://app.omdala.com" className="site-button site-button--ghost">
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
            <h2>OMDALA</h2>
            <p className="section-copy">{text.footerLead}</p>
          </div>

          <div className="footer-block">
            <p className="footer-heading">{text.platform}</p>
            <LocaleLink href={OMDALA_PAGES.whatIsOmdala}>{text.whatIsOmdala}</LocaleLink>
            <LocaleLink href={OMDALA_PAGES.howItWorks}>{text.nav.how}</LocaleLink>
            <LocaleLink href={OMDALA_PAGES.trust}>{text.trustArchitecture}</LocaleLink>
          </div>

          <div className="footer-block">
            <p className="footer-heading">{text.surfaces}</p>
            <a href="https://app.omdala.com">App</a>
            <a href="https://docs.omdala.com">Docs</a>
            <a href="https://api.omdala.com/health">{text.apiHealth}</a>
          </div>

          <div className="footer-block">
            <p className="footer-heading">{text.legalEntity}</p>
            <p className="section-copy">{ANGEL_EDU_TAM_FOUNDATION.legalName}</p>
            <p className="section-copy footer-address-preline">
              {ANGEL_EDU_TAM_FOUNDATION.addressLines.join('\n')}
            </p>
            <p className="section-copy">
              <a href={`mailto:${ANGEL_EDU_TAM_FOUNDATION.email}`}>{ANGEL_EDU_TAM_FOUNDATION.email}</a>
            </p>
            <p className="section-copy footer-legal-note">{text.legalSponsor}</p>
          </div>
        </div>
      </footer>
    </>
  )
}
