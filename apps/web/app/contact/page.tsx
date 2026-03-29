'use client'

import { OMDALA_INBOXES } from '../../../../packages/core/src/mail'
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
        </article>
      </section>
    </main>
  )
}
