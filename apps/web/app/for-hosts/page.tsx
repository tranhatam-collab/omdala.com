'use client'

import { audiencePages, pickText } from '../lib/content'
import { useWebLocale } from '../lib/useWebLocale'

export default function ForHostsPage() {
  const locale = useWebLocale()
  const content = audiencePages.hosts

  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{pickText(locale, content.hero.eyebrow)}</p>
        <h1>{pickText(locale, content.hero.title)}</h1>
        <p className="lead">{pickText(locale, content.hero.lead)}</p>
      </section>

      <section className="panel">
        <ul className="feature-list">
          {content.items.map((item) => (
            <li key={item.en}>{pickText(locale, item)}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}
