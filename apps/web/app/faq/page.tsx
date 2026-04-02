'use client'

import { faqContent, pickText } from '../lib/content'
import { useWebLocale } from '../lib/useWebLocale'

export default function FaqPage() {
  const locale = useWebLocale()

  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">FAQ</p>
        <h1>{pickText(locale, faqContent.hero.title)}</h1>
        <p className="lead">{pickText(locale, faqContent.hero.lead)}</p>
      </section>

      <section className="panel">
        <div className="faq-grid">
          {faqContent.questions.map((faq) => (
            <article key={faq.question.en}>
              <h3>{pickText(locale, faq.question)}</h3>
              <p>{pickText(locale, faq.answer)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
