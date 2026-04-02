'use client'

import { LocaleLink } from './components/LocaleLink'
import { homeContent, pickText } from './lib/content'
import { useWebLocale } from './lib/useWebLocale'

export default function HomePage() {
  const locale = useWebLocale()

  return (
    <main className="site-shell page-shell">
      {/* 1. HERO SECTION */}
      <section className="panel hero">
        <p className="eyebrow">{pickText(locale, homeContent.hero.eyebrow)}</p>
        <h1>{pickText(locale, homeContent.hero.title)}</h1>
        <p className="lead">{pickText(locale, homeContent.hero.lead)}</p>
        <div className="button-row">
          <LocaleLink href="/what-is-omdala" className="site-button site-button--primary">
            {pickText(locale, homeContent.hero.ctaPrimary)}
          </LocaleLink>
          <LocaleLink href="/how-it-works" className="site-button site-button--ghost">
            {pickText(locale, homeContent.hero.ctaSecondary)}
          </LocaleLink>
          <a href="https://docs.omdala.com" className="site-button site-button--ghost">
            {pickText(locale, homeContent.hero.ctaDocs)}
          </a>
        </div>
      </section>

      {/* 2. CORE LOOP */}
      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, homeContent.loop.eyebrow)}</p>
          <h2>{pickText(locale, homeContent.loop.title)}</h2>
        </div>

        <div className="stack-list">
          {homeContent.loop.items.map((item) => (
            <article key={item.title.en} className="stack-item">
              <h3>{pickText(locale, item.title)}</h3>
              <p>{pickText(locale, item.copy)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 3. STATE TRANSITION LAYER */}
      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, homeContent.stateTransition.eyebrow)}</p>
          <h2>{pickText(locale, homeContent.stateTransition.title)}</h2>
          <p className="section-copy">{pickText(locale, homeContent.stateTransition.copy)}</p>
        </div>

        <div className="card-grid">
          {homeContent.stateTransition.concepts.map((concept) => (
            <article key={concept.en}><h3>
              {pickText(locale, concept)}
            </h3></article>
          ))}
        </div>
      </section>

      {/* 4. COMMITMENTS ENGINE */}
      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, homeContent.commitments.eyebrow)}</p>
          <h2>{pickText(locale, homeContent.commitments.title)}</h2>
          <p className="section-copy">{pickText(locale, homeContent.commitments.copy)}</p>
        </div>

        <div className="metric-grid">
          {homeContent.commitments.features.map((feature) => (
            <article key={feature.en} className="metric-card">
              <strong>{pickText(locale, feature)}</strong>
            </article>
          ))}
        </div>
      </section>

      {/* 5. PROOF & TRUST SYSTEM */}
      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, homeContent.trust.eyebrow)}</p>
          <h2>{pickText(locale, homeContent.trust.title)}</h2>
          <p className="section-copy">{pickText(locale, homeContent.trust.copy)}</p>
        </div>

        <div className="card-grid">
          {homeContent.trust.signals.map((signal) => (
            <article key={signal.en}>
              <h3>{pickText(locale, signal)}</h3>
            </article>
          ))}
        </div>
      </section>

      {/* 6. AGI-SAFE GOVERNANCE */}
      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, homeContent.governance.eyebrow)}</p>
          <h2>{pickText(locale, homeContent.governance.title)}</h2>
          <p className="section-copy">{pickText(locale, homeContent.governance.copy)}</p>
        </div>
      </section>

      {/* 7. SYSTEM MAP */}
      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, homeContent.systemMap.eyebrow)}</p>
          <h2>{pickText(locale, homeContent.systemMap.title)}</h2>
        </div>

        <div className="card-grid">
          {homeContent.systemMap.layers.map((layer) => (
            <article key={layer.en}><h3>
              {pickText(locale, layer)}
            </h3></article>
          ))}
        </div>
      </section>

      {/* 8. USE CASES */}
      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, homeContent.useCases.eyebrow)}</p>
          <h2>{pickText(locale, homeContent.useCases.title)}</h2>
        </div>

        <div className="stack-list">
          {homeContent.useCases.examples.map((example) => (
            <article key={example.en} className="stack-item">
              <h3>{pickText(locale, example)}</h3>
            </article>
          ))}
        </div>
      </section>

      {/* 9. CTA FINAL */}
      <section className="panel hero">
        <h2>{pickText(locale, homeContent.ctaFinal.title)}</h2>
        <div className="button-row">
          <LocaleLink href="/what-is-omdala" className="site-button site-button--primary">
            {pickText(locale, homeContent.ctaFinal.primary)}
          </LocaleLink>
          <LocaleLink href="/contact" className="site-button site-button--ghost">
            {pickText(locale, homeContent.ctaFinal.secondary)}
          </LocaleLink>
        </div>
      </section>
    </main>
  )
}
