import type { Metadata } from 'next'
import Link from 'next/link'
import { getMockAdminSession, hasRequiredRole } from '@omdala/auth-service'
import './globals.css'

const adminNavigation = [
  { label: 'Overview', href: '/' },
  { label: 'Nodes', href: '/nodes' },
  { label: 'Offers', href: '/offers' },
  { label: 'Requests', href: '/requests' },
  { label: 'Proofs', href: '/proofs' },
  { label: 'Verifications', href: '/verifications' },
] as const

export const metadata: Metadata = {
  title: {
    default: 'OMDALA Admin',
    template: '%s — OMDALA Admin',
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
        <main className="admin-shell">
          <aside className="admin-sidebar">
            <section className="admin-card">
              <p className="admin-eyebrow">Restricted Surface</p>
              <Link href="/" className="admin-brand">
                OMDALA Admin
              </Link>
              <p className="admin-copy">{session.user.email}</p>
            </section>

            <nav className="admin-card admin-nav" aria-label="Admin navigation">
              {adminNavigation.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section className="admin-main">
            {canAccessAdmin ? (
              children
            ) : (
              <section className="admin-card">
                <p className="admin-eyebrow">Access Restricted</p>
                <h1>Admin role required</h1>
                <p className="admin-copy">
                  This surface is reserved for moderation and operations roles. Wire the real auth
                  provider before exposing this deployment publicly.
                </p>
              </section>
            )}
          </section>
        </main>
      </body>
    </html>
  )
}
