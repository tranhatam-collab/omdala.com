import type { OmdalaLanguage } from '@omdala/core'
import { WebPageShell } from '../WebPageShell'
import { getPublicPageBodyCopy, isBilingualLanguage } from '../lib/bilingual-source'
import { definitionContent, pickText } from '../lib/content'

export function WhatIsOmdalaPageView({ locale }: { locale: OmdalaLanguage }) {
  const body = isBilingualLanguage(locale)
    ? getPublicPageBodyCopy('whatIsOmdala', locale)
    : null

  return (
    <WebPageShell language={locale}>
      <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{body ? body.heroEyebrow : pickText(locale, definitionContent.hero.eyebrow)}</p>
        <h1>{body ? body.heroTitle : pickText(locale, definitionContent.hero.title)}</h1>
        <p className="lead">{body ? body.heroLead : pickText(locale, definitionContent.hero.lead)}</p>
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
            : definitionContent.cards.map((card) => (
                <article key={card.title.en}>
                  <h3>{pickText(locale, card.title)}</h3>
                  <p>{pickText(locale, card.copy)}</p>
                </article>
              ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{body ? body.layers.eyebrow : pickText(locale, definitionContent.layers.eyebrow)}</p>
          <h2>{body ? body.layers.title : pickText(locale, definitionContent.layers.title)}</h2>
        </div>
        <ul className="feature-list">
          {body
            ? body.layers.items.map((item) => <li key={item}>{item}</li>)
            : definitionContent.layers.items.map((item) => (
                <li key={item.en}>{pickText(locale, item)}</li>
              ))}
        </ul>
      </section>
      </main>
    </WebPageShell>
  )
}
