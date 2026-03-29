'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'
import { OMDALA_INBOXES } from '../../../../packages/core/src/mail'
import { ContactForm } from './ContactForm'

export default function ContactPage() {
  const [isVi, setIsVi] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsVi(resolveLanguage(new URLSearchParams(window.location.search).get('lang')) === 'vi')
  }, [])

  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{isVi ? 'Bề mặt liên hệ' : 'Contact Surface'}</p>
        <h1>{isVi ? 'Liên hệ lớp inbox đang hoạt động của OMDALA.' : 'Contact the live OMDALA inbox layer.'}</h1>
        <p className="lead">
          {isVi
            ? 'Liên hệ công khai hiện đi qua cùng hệ thống mail mà nền tảng dùng cho hỗ trợ, onboarding ứng dụng và phản hồi vận hành.'
            : 'Public contact now routes through the same mail system the platform uses for support, app onboarding, and operator response.'}
        </p>
      </section>

      <section className="contact-layout">
        <article className="panel contact-panel">
          <div className="section-header">
            <h2>{isVi ? 'Biểu mẫu liên hệ' : 'Contact form'}</h2>
            <p className="section-copy">
              {isVi
                ? 'Dùng biểu mẫu này cho hỗ trợ, trao đổi hợp tác, câu hỏi về niềm tin hoặc điều hướng sản phẩm.'
                : 'Use this form for support, partnership discussions, trust questions, or product routing.'}
            </p>
          </div>
          <ContactForm />
        </article>

        <article className="panel contact-panel">
          <div className="section-header">
            <h2>{isVi ? 'Hộp thư chính thức' : 'Official inboxes'}</h2>
            <p className="section-copy">
              {isVi
                ? 'Các hộp thư này là điểm điều hướng công khai mà lớp web, app, docs và vận hành có thể dùng ngay.'
                : 'These inboxes are the public routing points the web, app, docs, and operator layer can use immediately.'}
            </p>
          </div>

          <div className="card-grid">
            <article>
              <h3>{isVi ? 'Tổng quát' : 'General'}</h3>
              <p><a href={`mailto:${OMDALA_INBOXES.hello}`}>{OMDALA_INBOXES.hello}</a></p>
            </article>
            <article>
              <h3>{isVi ? 'Hỗ trợ' : 'Support'}</h3>
              <p><a href={`mailto:${OMDALA_INBOXES.support}`}>{OMDALA_INBOXES.support}</a></p>
            </article>
            <article>
              <h3>{isVi ? 'Ứng dụng' : 'App'}</h3>
              <p><a href={`mailto:${OMDALA_INBOXES.app}`}>{OMDALA_INBOXES.app}</a></p>
            </article>
            <article>
              <h3>{isVi ? 'Niềm tin' : 'Trust'}</h3>
              <p><a href={`mailto:${OMDALA_INBOXES.trust}`}>{OMDALA_INBOXES.trust}</a></p>
            </article>
          </div>

          <ul className="contact-list">
            <li>{isVi ? 'Mail xác thực và magic-link' : 'Auth and magic-link mail'}: <span className="inline-code">{OMDALA_INBOXES.noreply}</span></li>
            <li>{isVi ? 'Điều hướng docs và API' : 'Docs and API routing'}: <span className="inline-code">{OMDALA_INBOXES.docs}</span></li>
            <li>{isVi ? 'Vận hành admin' : 'Admin operations'}: <span className="inline-code">{OMDALA_INBOXES.admin}</span></li>
          </ul>
        </article>
      </section>
    </main>
  )
}
