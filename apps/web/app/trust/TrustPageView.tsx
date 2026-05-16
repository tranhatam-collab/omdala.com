import type { OmdalaLanguage } from '@omdala/core'
import { WebPageShell } from '../WebPageShell'
import { getPublicPageBodyCopy, isBilingualLanguage } from '../lib/bilingual-source'
import { pickText, trustContent } from '../lib/content'

export function TrustPageView({ locale }: { locale: OmdalaLanguage }) {
  const body = isBilingualLanguage(locale)
    ? getPublicPageBodyCopy('trust', locale)
    : null

  return (
    <WebPageShell language={locale}>
      <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{body ? body.heroEyebrow : pickText(locale, trustContent.hero.eyebrow)}</p>
        <h1>{body ? body.heroTitle : pickText(locale, trustContent.hero.title)}</h1>
        <p className="lead">{body ? body.heroLead : pickText(locale, trustContent.hero.lead)}</p>
      </section>

      <section className="panel">
        <div className="card-grid">
          {body
            ? body.cards.map((card) => (
                <article key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                </article>
              ))
            : trustContent.cards.map((card) => (
                <article key={card.title.en}>
                  <h3>{pickText(locale, card.title)}</h3>
                  <p>{pickText(locale, card.copy)}</p>
                </article>
              ))}
        </div>
      </section>
      </main>
    </WebPageShell>
  )
}
