'use client'

import { definitionContent, pickText } from '../lib/content'
import { useWebLocale } from '../lib/useWebLocale'

export default function WhatIsOmdalaPage() {
  const locale = useWebLocale()

  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{pickText(locale, definitionContent.hero.eyebrow)}</p>
        <h1>{pickText(locale, definitionContent.hero.title)}</h1>
        <p className="lead">{pickText(locale, definitionContent.hero.lead)}</p>
      </section>

      <section className="panel">
        <div className="card-grid">
          {definitionContent.cards.map((card) => (
            <article key={card.title.en}>
              <h3>{pickText(locale, card.title)}</h3>
              <p>{pickText(locale, card.copy)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, definitionContent.layers.eyebrow)}</p>
          <h2>{pickText(locale, definitionContent.layers.title)}</h2>
        </div>
        <ul className="feature-list">
          {definitionContent.layers.items.map((item) => (
            <li key={item.en}>{pickText(locale, item)}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}
