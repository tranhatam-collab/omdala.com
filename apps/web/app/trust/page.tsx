'use client'

import { pickText, trustContent } from '../lib/content'
import { useWebLocale } from '../lib/useWebLocale'

export default function TrustPage() {
  const locale = useWebLocale()

  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{pickText(locale, trustContent.hero.eyebrow)}</p>
        <h1>{pickText(locale, trustContent.hero.title)}</h1>
        <p className="lead">{pickText(locale, trustContent.hero.lead)}</p>
      </section>

      <section className="panel">
        <div className="card-grid">
          {trustContent.cards.map((card) => (
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
