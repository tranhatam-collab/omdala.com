'use client'

import { ANGEL_EDU_TAM_FOUNDATION, OMDALA_INBOXES } from '@omdala/core'
import { contactContent, pickText } from '../lib/content'
import { useWebLocale } from '../lib/useWebLocale'
import { ContactForm } from './ContactForm'

export default function ContactPage() {
  const locale = useWebLocale()

  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{pickText(locale, contactContent.hero.eyebrow)}</p>
        <h1>{pickText(locale, contactContent.hero.title)}</h1>
        <p className="lead">{pickText(locale, contactContent.hero.lead)}</p>
      </section>

      <section className="contact-layout">
        <article className="panel contact-panel">
          <div className="section-header">
            <h2>{pickText(locale, contactContent.form.title)}</h2>
            <p className="section-copy">{pickText(locale, contactContent.form.copy)}</p>
          </div>
          <ContactForm />
        </article>

        <article className="panel contact-panel">
          <div className="section-header">
            <h2>{pickText(locale, contactContent.inboxes.title)}</h2>
            <p className="section-copy">{pickText(locale, contactContent.inboxes.copy)}</p>
          </div>

          <div className="card-grid">
            {contactContent.inboxes.cards.map((card) => (
              <article key={card.key}>
                <h3>{pickText(locale, card.label)}</h3>
                <p>
                  <a href={`mailto:${OMDALA_INBOXES[card.key as keyof typeof OMDALA_INBOXES]}`}>
                    {OMDALA_INBOXES[card.key as keyof typeof OMDALA_INBOXES]}
                  </a>
                </p>
              </article>
            ))}
          </div>

          <ul className="contact-list">
            {contactContent.notes.map((note) => (
              <li key={note.key}>
                {pickText(locale, note)}:{' '}
                <span className="inline-code">
                  {OMDALA_INBOXES[note.key as keyof typeof OMDALA_INBOXES]}
                </span>
              </li>
            ))}
          </ul>

          <div className="section-header contact-org-block">
            <h2>{locale === 'vi' ? 'Pháp lý' : 'Legal'}</h2>
            <p className="section-copy">{ANGEL_EDU_TAM_FOUNDATION.legalName}</p>
            <p className="section-copy">
              <span className="footer-legal-label">Email:</span>{' '}
              <a href={`mailto:${ANGEL_EDU_TAM_FOUNDATION.email}`}>{ANGEL_EDU_TAM_FOUNDATION.email}</a>
            </p>
            <p className="section-copy">
              <span className="footer-legal-label">Web:</span>{' '}
              <a href={ANGEL_EDU_TAM_FOUNDATION.websiteUrl} rel="noopener noreferrer">
                {ANGEL_EDU_TAM_FOUNDATION.websiteDisplay}
              </a>
            </p>
          </div>
        </article>
      </section>
    </main>
  )
}
