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
            <h2>{locale === 'vi' ? 'Pháp nhân tài trợ' : 'Sponsoring legal entity'}</h2>
            <p className="section-copy">
              {locale === 'vi'
                ? 'OMDALA được tài trợ và phát hành trong khuôn khổ Angel Edu Tam Foundation Inc, cùng hệ sinh thái *.iai.one và omdalat.com (hỗ trợ công nghệ miễn phí).'
                : 'OMDALA is sponsored and published under Angel Edu Tam Foundation Inc, alongside the *.iai.one ecosystem and omdalat.com (fully sponsored technology).'}
            </p>
            <p className="section-copy">{ANGEL_EDU_TAM_FOUNDATION.legalName}</p>
            <p className="section-copy footer-address-preline">
              {ANGEL_EDU_TAM_FOUNDATION.addressLines.join('\n')}
            </p>
            <p className="section-copy">
              <a href={`mailto:${ANGEL_EDU_TAM_FOUNDATION.email}`}>{ANGEL_EDU_TAM_FOUNDATION.email}</a>
            </p>
            <p className="section-copy">
              <a href="https://docs.iai.one/legal/">docs.iai.one/legal</a>
              {' — '}
              {locale === 'vi' ? 'trung tâm điều khoản IAI Flow' : 'IAI Flow legal hub'}
            </p>
          </div>
        </article>
      </section>
    </main>
  )
}
