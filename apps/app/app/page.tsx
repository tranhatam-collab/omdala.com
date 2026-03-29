'use client'

import { AUTH_ENTRY_LINKS } from '@omdala/core'
import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'
import { LocaleLink } from './components/LocaleLink'

export default function AppPage() {
  const [isVi, setIsVi] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsVi(resolveLanguage(new URLSearchParams(window.location.search).get('lang')) === 'vi')
  }, [])

  return (
    <main className="app-shell auth-shell">
      <section className="auth-card">
        <p className="app-eyebrow">{isVi ? 'Bề mặt xác thực' : 'Authenticated Surface'}</p>
        <h1>OMDALA App</h1>
        <p className="app-copy">
          {isVi
            ? 'Bề mặt này dành cho người vận hành đã đăng nhập, làm việc với node, tài nguyên, niềm tin và luồng hành động. Dùng điểm vào xác thực bên dưới để tiếp tục giai đoạn triển khai kế tiếp.'
            : 'This surface is for logged-in operators working with nodes, resources, trust, and action flows. Use the auth entry points below to continue the next build phase.'}
        </p>

        <div className="app-button-row">
          {AUTH_ENTRY_LINKS.map((item) => (
            <LocaleLink key={item.href} href={item.href} className="app-button app-button--primary">
              {isVi ? (item.label === 'Log in' ? 'Đăng nhập' : 'Tạo tài khoản') : item.label}
            </LocaleLink>
          ))}
        </div>

        <div className="auth-helper-links">
          <LocaleLink href="/dashboard">{isVi ? 'Mở dashboard' : 'Open dashboard shell'}</LocaleLink>
          <a href="https://omdala.com">Back to omdala.com</a>
        </div>
      </section>
    </main>
  )
}
