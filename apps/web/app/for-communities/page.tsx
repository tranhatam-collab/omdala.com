'use client'

import { audiencePages, pickText } from '../lib/content'
import { useWebLocale } from '../lib/useWebLocale'

export default function ForCommunitiesPage() {
  const locale = useWebLocale()
  const content = audiencePages.communities

  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{pickText(locale, content.hero.eyebrow)}</p>
        <h1>{pickText(locale, content.hero.title)}</h1>
        <p className="lead">{pickText(locale, content.hero.lead)}</p>
      </section>

      <section className="panel">
        <div className="card-grid">
          {content.cards.map((card) => (
            <article key={card.title.en}>
              <h3>{pickText(locale, card.title)}</h3>
              <p>{pickText(locale, card.copy)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
