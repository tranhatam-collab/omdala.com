import type { Metadata } from 'next'
import { getMockAdminSession, hasRequiredRole } from '@omdala/auth-service'
import { DocumentLanguageSync } from '@omdala/ui'
import { ADMIN_COPY, t } from './lib/admin-copy'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { LocaleLink } from './components/LocaleLink'
import './globals.css'

const language = 'en' as const

const adminNavigation = [
  { label: ADMIN_COPY.layout.nav.overview, href: '/' },
  { label: ADMIN_COPY.layout.nav.providers, href: '/providers' },
  { label: ADMIN_COPY.layout.nav.nodes, href: '/nodes' },
  { label: ADMIN_COPY.layout.nav.offers, href: '/offers' },
  { label: ADMIN_COPY.layout.nav.requests, href: '/requests' },
  { label: ADMIN_COPY.layout.nav.proofs, href: '/proofs' },
  { label: ADMIN_COPY.layout.nav.verifications, href: '/verifications' },
] as const

export const metadata: Metadata = {
  title: {
    default: 'OMDALA Admin',
    template: '%s - OMDALA Admin',
  },
  description: 'Restricted moderation and operations surface for OMDALA.',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = getMockAdminSession()
  const canAccessAdmin = hasRequiredRole(session, ['admin', 'system'])

  return (
    <html lang="en">
      <body>
        <DocumentLanguageSync />
        <main className="admin-shell">
          <aside className="admin-sidebar">
            <section className="admin-card">
              <p className="admin-eyebrow">{t(language, ADMIN_COPY.layout.restrictedSurface)}</p>
              <LocaleLink href="/" className="admin-brand">
                {t(language, ADMIN_COPY.layout.brand)}
              </LocaleLink>
              <p className="admin-copy">{session.user.email}</p>
              <LanguageSwitcher />
            </section>

            <nav
              className="admin-card admin-nav"
              aria-label={t(language, ADMIN_COPY.layout.adminNavigation)}
            >
              {adminNavigation.map((item) => (
                <LocaleLink key={item.href} href={item.href}>
                  {t(language, item.label)}
                </LocaleLink>
              ))}
            </nav>
          </aside>

          <section className="admin-main">
            {canAccessAdmin ? (
              children
            ) : (
              <section className="admin-card">
                <p className="admin-eyebrow">{t(language, ADMIN_COPY.layout.accessRestricted)}</p>
                <h1>{t(language, ADMIN_COPY.layout.adminRoleRequired)}</h1>
                <p className="admin-copy">{t(language, ADMIN_COPY.layout.restrictedCopy)}</p>
              </section>
            )}
          </section>
        </main>
      </body>
    </html>
  )
}
