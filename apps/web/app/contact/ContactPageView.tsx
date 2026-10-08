import { ANGEL_EDU_TAM_FOUNDATION, OMDALA_INBOXES, pickLanguageValue, type OmdalaLanguage } from '@omdala/core'
import { WebPageShell } from '../WebPageShell'
import { getPublicPageBodyCopy, isBilingualLanguage } from '../lib/bilingual-source'
import { contactContent, pickText } from '../lib/content'
import { ContactForm } from './ContactForm'

export function ContactPageView({ locale }: { locale: OmdalaLanguage }) {
  const body = isBilingualLanguage(locale)
    ? getPublicPageBodyCopy('contact', locale)
    : null
  const legalLabel = body?.legal.title ?? pickLanguageValue(locale, {
    en: 'Legal',
    vi: 'Pháp lý',
    zh: '法务',
    es: 'Legal',
    ja: '法務',
    ko: '법률',
  })
  const emailLabel = body?.legal.emailLabel ?? pickLanguageValue(locale, {
    en: 'Email',
    vi: 'Email',
    zh: '邮箱',
    es: 'Correo',
    ja: 'メール',
    ko: '이메일',
  })
  const webLabel = body?.legal.webLabel ?? pickLanguageValue(locale, {
    en: 'Web',
    vi: 'Trang web',
    zh: '网站',
    es: 'Sitio web',
    ja: 'ウェブ',
    ko: '웹',
  })

  return (
    <WebPageShell language={locale}>
      <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{body ? body.heroEyebrow : pickText(locale, contactContent.hero.eyebrow)}</p>
        <h1>{body ? body.heroTitle : pickText(locale, contactContent.hero.title)}</h1>
        <p className="lead">{body ? body.heroLead : pickText(locale, contactContent.hero.lead)}</p>
      </section>

      <section className="contact-layout">
        <article className="panel contact-panel">
          <div className="section-header">
            <h2>{body ? body.form.title : pickText(locale, contactContent.form.title)}</h2>
            <p className="section-copy">{body ? body.form.copy : pickText(locale, contactContent.form.copy)}</p>
          </div>
          <ContactForm language={locale} />
        </article>

        <article className="panel contact-panel">
          <div className="section-header">
            <h2>{body ? body.inboxes.title : pickText(locale, contactContent.inboxes.title)}</h2>
            <p className="section-copy">{body ? body.inboxes.copy : pickText(locale, contactContent.inboxes.copy)}</p>
          </div>

          <div className="card-grid">
            {body
              ? Object.entries(body.inboxes.labels).map(([key, label]) => (
                  <article key={key}>
                    <h3>{label}</h3>
                    <p>
                      <a href={`mailto:${OMDALA_INBOXES[key as keyof typeof OMDALA_INBOXES]}`}>
                        {OMDALA_INBOXES[key as keyof typeof OMDALA_INBOXES]}
                      </a>
                    </p>
                  </article>
                ))
              : contactContent.inboxes.cards.map((card) => (
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
            {body
              ? Object.entries(body.notes).map(([key, label]) => (
                  <li key={key}>
                    {label}:{' '}
                    <span className="inline-code">
                      {OMDALA_INBOXES[key as keyof typeof OMDALA_INBOXES]}
                    </span>
                  </li>
                ))
              : contactContent.notes.map((note) => (
                  <li key={note.key}>
                    {pickText(locale, note)}:{' '}
                    <span className="inline-code">
                      {OMDALA_INBOXES[note.key as keyof typeof OMDALA_INBOXES]}
                    </span>
                  </li>
                ))}
          </ul>

          <div className="section-header contact-org-block">
            <h2>{legalLabel}</h2>
            <p className="section-copy">{ANGEL_EDU_TAM_FOUNDATION.legalName}</p>
            <p className="section-copy">
              <span className="footer-legal-label">{emailLabel}:</span>{' '}
              <a href={`mailto:${ANGEL_EDU_TAM_FOUNDATION.email}`}>{ANGEL_EDU_TAM_FOUNDATION.email}</a>
            </p>
            <p className="section-copy">
              <span className="footer-legal-label">{webLabel}:</span>{' '}
              <a href={ANGEL_EDU_TAM_FOUNDATION.websiteUrl} rel="noopener noreferrer">
                {ANGEL_EDU_TAM_FOUNDATION.websiteDisplay}
              </a>
            </p>
          </div>
        </article>
      </section>
      </main>
    </WebPageShell>
  )
}
