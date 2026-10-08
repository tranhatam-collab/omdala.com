import type { OmdalaLanguage } from '@omdala/core'
import { WebPageShell } from '../WebPageShell'
import { getPublicPageBodyCopy, isBilingualLanguage } from '../lib/bilingual-source'
import { audiencePages, pickText } from '../lib/content'

export function ForExpertsPageView({ locale }: { locale: OmdalaLanguage }) {
  const legacyContent = audiencePages.experts
  const body = isBilingualLanguage(locale)
    ? getPublicPageBodyCopy('forExperts', locale)
    : null

  return (
    <WebPageShell language={locale}>
      <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{body ? body.heroEyebrow : pickText(locale, legacyContent.hero.eyebrow)}</p>
        <h1>{body ? body.heroTitle : pickText(locale, legacyContent.hero.title)}</h1>
        <p className="lead">{body ? body.heroLead : pickText(locale, legacyContent.hero.lead)}</p>
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
            : legacyContent.cards.map((card) => (
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
