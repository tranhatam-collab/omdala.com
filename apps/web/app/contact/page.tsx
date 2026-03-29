import type { Metadata } from 'next'
import { buildMetadata } from '@omdala/seo'
import { OMDALA_INBOXES } from '../../../../packages/core/src/mail'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = buildMetadata({
  title:       'Contact',
  description:
    'Current official OMDALA surfaces for product, documentation, and API access before public launch expansion.',
  path: '/contact',
})

export default function ContactPage() {
  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">Contact Surface</p>
        <h1>Contact the live OMDALA inbox layer.</h1>
        <p className="lead">
          Public contact now routes through the same mail system the platform uses for support, app
          onboarding, and operator response.
        </p>
      </section>

      <section className="contact-layout">
        <article className="panel contact-panel">
          <div className="section-header">
            <h2>Contact form / Form liên hệ</h2>
            <p className="section-copy">
              Use this form for support, partnership discussions, trust questions, or product routing.
            </p>
          </div>
          <ContactForm />
        </article>

        <article className="panel contact-panel">
          <div className="section-header">
            <h2>Official inboxes / Hộp thư chính thức</h2>
            <p className="section-copy">
              These inboxes are the public routing points the web, app, docs, and operator layer can use immediately.
            </p>
          </div>

          <div className="card-grid">
            <article>
              <h3>General / Tổng quát</h3>
              <p><a href={`mailto:${OMDALA_INBOXES.hello}`}>{OMDALA_INBOXES.hello}</a></p>
            </article>
            <article>
              <h3>Support / Hỗ trợ</h3>
              <p><a href={`mailto:${OMDALA_INBOXES.support}`}>{OMDALA_INBOXES.support}</a></p>
            </article>
            <article>
              <h3>App / Ứng dụng</h3>
              <p><a href={`mailto:${OMDALA_INBOXES.app}`}>{OMDALA_INBOXES.app}</a></p>
            </article>
            <article>
              <h3>Trust / Niềm tin</h3>
              <p><a href={`mailto:${OMDALA_INBOXES.trust}`}>{OMDALA_INBOXES.trust}</a></p>
            </article>
          </div>

          <ul className="contact-list">
            <li>Auth and magic-link mail: <span className="inline-code">{OMDALA_INBOXES.noreply}</span></li>
            <li>Docs and API routing: <span className="inline-code">{OMDALA_INBOXES.docs}</span></li>
            <li>Admin operations: <span className="inline-code">{OMDALA_INBOXES.admin}</span></li>
          </ul>
        </article>
      </section>
    </main>
  )
}
