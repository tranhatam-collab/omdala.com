'use client'

import { APP_PRIMARY_NAV } from '@omdala/core'
import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'
import { LocaleLink } from '../components/LocaleLink'

const NAV_LABELS_VI: Record<string, string> = {
  Dashboard: 'Bảng điều khiển',
  Nodes: 'Node',
  Resources: 'Tài nguyên',
  Offers: 'Đề nghị',
  Requests: 'Nhu cầu',
  Profile: 'Hồ sơ',
  Settings: 'Cài đặt',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isVi, setIsVi] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsVi(resolveLanguage(new URLSearchParams(window.location.search).get('lang')) === 'vi')
  }, [])

  return (
    <main className="app-shell dashboard-layout">
      <aside className="dashboard-sidebar">
        <section className="dashboard-card">
          <p className="app-eyebrow">{isVi ? 'Bề mặt sản phẩm' : 'Product Surface'}</p>
          <LocaleLink href="/dashboard" className="dashboard-brand">
            OMDALA App
          </LocaleLink>
        </section>

        <nav className="dashboard-card dashboard-nav" aria-label="App navigation">
          {APP_PRIMARY_NAV.map((item) => (
            <LocaleLink key={item.href} href={item.href}>
              {isVi ? NAV_LABELS_VI[item.label] ?? item.label : item.label}
            </LocaleLink>
          ))}
        </nav>
      </aside>

      <section className="dashboard-main">{children}</section>
    </main>
  )
}
