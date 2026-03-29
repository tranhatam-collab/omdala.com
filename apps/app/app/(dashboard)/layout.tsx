import Link from 'next/link'
import { APP_PRIMARY_NAV } from '@omdala/core'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="app-shell dashboard-layout">
      <aside className="dashboard-sidebar">
        <section className="dashboard-card">
          <p className="app-eyebrow">Product Surface</p>
          <Link href="/dashboard" className="dashboard-brand">
            OMDALA App
          </Link>
        </section>

        <nav className="dashboard-card dashboard-nav" aria-label="App navigation">
          {APP_PRIMARY_NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="dashboard-main">{children}</section>
    </main>
  )
}
