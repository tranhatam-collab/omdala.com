'use client'

import { pickText, visionContent } from '../lib/content'
import { useWebLocale } from '../lib/useWebLocale'

export default function VisionPage() {
  const locale = useWebLocale()

  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{pickText(locale, visionContent.hero.eyebrow)}</p>
        <h1>{pickText(locale, visionContent.hero.title)}</h1>
        <p className="lead">{pickText(locale, visionContent.hero.lead)}</p>
      </section>

      <section className="panel">
        <div className="stack-list">
          {visionContent.horizons.map((horizon) => (
            <article key={horizon.title.en} className="stack-item">
              <h3>{pickText(locale, horizon.title)}</h3>
              <p>{pickText(locale, horizon.copy)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
