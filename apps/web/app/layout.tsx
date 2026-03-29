import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { getOrganizationSchema, getWebSiteSchema, OMDALA_PAGES } from '@omdala/seo'
import './globals.css'

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

const primaryNavigation = [
  { label: 'What it is', href: OMDALA_PAGES.whatIsOmdala },
  { label: 'How it works', href: OMDALA_PAGES.howItWorks },
  { label: 'Experts', href: OMDALA_PAGES.forExperts },
  { label: 'Hosts', href: OMDALA_PAGES.forHosts },
  { label: 'Communities', href: OMDALA_PAGES.forCommunities },
  { label: 'Trust', href: OMDALA_PAGES.trust },
  { label: 'Vision', href: OMDALA_PAGES.vision },
] as const

export const metadata: Metadata = {
  metadataBase: new URL('https://omdala.com'),
  title: {
    default:  'OMDALA — The Operating Layer for Real-World Value',
    template: '%s — OMDALA',
  },
  description:
    'OMDALA is the global operating layer for real-world value, trust, and intelligent coordination.',
  openGraph: {
    siteName: 'OMDALA',
    type:     'website',
    locale:   'en_US',
    images: [
      {
        url:    '/og-default.svg',
        width:  1200,
        height: 630,
        alt:    'OMDALA — The Operating Layer for Real-World Value',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor:   '#040816',
  colorScheme:  'dark',
  width:        'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              getOrganizationSchema(),
              getWebSiteSchema(),
            ]),
          }}
        />
      </head>
      <body>
        <header className="site-header">
          <div className="site-shell site-header__inner">
            <Link href={OMDALA_PAGES.home} className="brand-mark">
              OMDALA
            </Link>

            <nav className="site-nav" aria-label="Primary">
              {primaryNavigation.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <a href="https://app.omdala.com" className="site-button site-button--ghost">
              Enter App
            </a>
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <div className="site-shell footer-grid">
            <div className="footer-block">
              <p className="eyebrow">Master Platform</p>
              <h2>OMDALA</h2>
              <p className="section-copy">
                The operating layer for real-world value, trust, and intelligent coordination.
              </p>
            </div>

            <div className="footer-block">
              <p className="footer-heading">Platform</p>
              <Link href={OMDALA_PAGES.whatIsOmdala}>What OMDALA is</Link>
              <Link href={OMDALA_PAGES.howItWorks}>How it works</Link>
              <Link href={OMDALA_PAGES.trust}>Trust architecture</Link>
            </div>

            <div className="footer-block">
              <p className="footer-heading">Surfaces</p>
              <a href="https://app.omdala.com">App</a>
              <a href="https://docs.omdala.com">Docs</a>
              <a href="https://api.omdala.com/health">API health</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
