'use client'

import { pickText, processContent } from '../lib/content'
import { useWebLocale } from '../lib/useWebLocale'

export default function HowItWorksPage() {
  const locale = useWebLocale()

  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{pickText(locale, processContent.hero.eyebrow)}</p>
        <h1>{pickText(locale, processContent.hero.title)}</h1>
        <p className="lead">{pickText(locale, processContent.hero.lead)}</p>
      </section>

      <section className="panel">
        <div className="stack-list">
          {processContent.steps.map((step) => (
            <article key={step.title.en} className="stack-item">
              <h3>{pickText(locale, step.title)}</h3>
              <p>{pickText(locale, step.copy)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
