import type { OmdalaLanguage } from '@omdala/core'
import { LocaleLink } from './components/LocaleLink'
import { WebPageShell } from './WebPageShell'
import { getPublicPageBodyCopy, isBilingualLanguage } from './lib/bilingual-source'
import { homeContent, pickText } from './lib/content'

export function HomePageView({ locale }: { locale: OmdalaLanguage }) {
  const body = isBilingualLanguage(locale)
    ? getPublicPageBodyCopy('home', locale)
    : null

  return (
    <WebPageShell language={locale}>
      <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{body ? body.heroEyebrow : pickText(locale, homeContent.hero.eyebrow)}</p>
        <h1>{body ? body.heroTitle : pickText(locale, homeContent.hero.title)}</h1>
        <p className="lead">{body ? body.heroLead : pickText(locale, homeContent.hero.lead)}</p>
        <div className="button-row">
          <LocaleLink href="/what-is-omdala" className="site-button site-button--primary" language={locale}>
            {body ? body.heroCtaPrimary : pickText(locale, homeContent.hero.ctaPrimary)}
          </LocaleLink>
          <LocaleLink href="/how-it-works" className="site-button site-button--ghost" language={locale}>
            {body ? body.heroCtaSecondary : pickText(locale, homeContent.hero.ctaSecondary)}
          </LocaleLink>
          <a href="https://docs.omdala.com" className="site-button site-button--ghost">
            {body ? body.heroCtaDocs : pickText(locale, homeContent.hero.ctaDocs)}
          </a>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{body ? body.loop.eyebrow : pickText(locale, homeContent.loop.eyebrow)}</p>
          <h2>{body ? body.loop.title : pickText(locale, homeContent.loop.title)}</h2>
        </div>

        <div className="stack-list">
          {body
            ? body.loop.items.map((item) => (
                <article key={item.title} className="stack-item">
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))
            : homeContent.loop.items.map((item) => (
                <article key={item.title.en} className="stack-item">
                  <h3>{pickText(locale, item.title)}</h3>
                  <p>{pickText(locale, item.copy)}</p>
                </article>
              ))}
        </div>
      </section>

      {body ? (
        <section className="panel">
          <div className="section-header">
            <p className="eyebrow">{body.projectRoadmap.eyebrow}</p>
            <h2>{body.projectRoadmap.title}</h2>
            <p className="section-copy">{body.projectRoadmap.copy}</p>
          </div>

          <div className="stack-list">
            {body.projectRoadmap.milestones.map((milestone) => (
              <article key={milestone.title} className="stack-item">
                <h3>{milestone.title}</h3>
                <p>{milestone.copy}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {body ? (
        <section className="panel">
          <div className="section-header">
            <p className="eyebrow">{body.realWorldApplications.eyebrow}</p>
            <h2>{body.realWorldApplications.title}</h2>
            <p className="section-copy">{body.realWorldApplications.copy}</p>
          </div>

          <div className="stack-list">
            {body.realWorldApplications.cases.map((item) => (
              <article key={item} className="stack-item">
                <h3>{item}</h3>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {body ? (
        <section className="panel">
          <div className="section-header">
            <p className="eyebrow">{body.releaseReadiness.eyebrow}</p>
            <h2>{body.releaseReadiness.title}</h2>
          </div>

          <ul className="feature-list">
            {body.releaseReadiness.checks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{body ? body.stateTransition.eyebrow : pickText(locale, homeContent.stateTransition.eyebrow)}</p>
          <h2>{body ? body.stateTransition.title : pickText(locale, homeContent.stateTransition.title)}</h2>
          <p className="section-copy">{body ? body.stateTransition.copy : pickText(locale, homeContent.stateTransition.copy)}</p>
        </div>

        <div className="card-grid">
          {body
            ? body.stateTransition.concepts.map((concept) => (
                <article key={concept}>
                  <h3>{concept}</h3>
                </article>
              ))
            : homeContent.stateTransition.concepts.map((concept) => (
                <article key={concept.en}>
                  <h3>{pickText(locale, concept)}</h3>
                </article>
              ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{body ? body.commitments.eyebrow : pickText(locale, homeContent.commitments.eyebrow)}</p>
          <h2>{body ? body.commitments.title : pickText(locale, homeContent.commitments.title)}</h2>
          <p className="section-copy">{body ? body.commitments.copy : pickText(locale, homeContent.commitments.copy)}</p>
        </div>

        <div className="metric-grid">
          {body
            ? body.commitments.features.map((feature) => (
                <article key={feature} className="metric-card">
                  <strong>{feature}</strong>
                </article>
              ))
            : homeContent.commitments.features.map((feature) => (
                <article key={feature.en} className="metric-card">
                  <strong>{pickText(locale, feature)}</strong>
                </article>
              ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{body ? body.trust.eyebrow : pickText(locale, homeContent.trust.eyebrow)}</p>
          <h2>{body ? body.trust.title : pickText(locale, homeContent.trust.title)}</h2>
          <p className="section-copy">{body ? body.trust.copy : pickText(locale, homeContent.trust.copy)}</p>
        </div>

        <div className="card-grid">
          {body
            ? body.trust.signals.map((signal) => (
                <article key={signal}>
                  <h3>{signal}</h3>
                </article>
              ))
            : homeContent.trust.signals.map((signal) => (
                <article key={signal.en}>
                  <h3>{pickText(locale, signal)}</h3>
                </article>
              ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{body ? body.governance.eyebrow : pickText(locale, homeContent.governance.eyebrow)}</p>
          <h2>{body ? body.governance.title : pickText(locale, homeContent.governance.title)}</h2>
          <p className="section-copy">{body ? body.governance.copy : pickText(locale, homeContent.governance.copy)}</p>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{body ? body.systemMap.eyebrow : pickText(locale, homeContent.systemMap.eyebrow)}</p>
          <h2>{body ? body.systemMap.title : pickText(locale, homeContent.systemMap.title)}</h2>
        </div>

        <div className="card-grid">
          {body
            ? body.systemMap.layers.map((layer) => (
                <article key={layer}>
                  <h3>{layer}</h3>
                </article>
              ))
            : homeContent.systemMap.layers.map((layer) => (
                <article key={layer.en}>
                  <h3>{pickText(locale, layer)}</h3>
                </article>
              ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{body ? body.useCases.eyebrow : pickText(locale, homeContent.useCases.eyebrow)}</p>
          <h2>{body ? body.useCases.title : pickText(locale, homeContent.useCases.title)}</h2>
        </div>

        <div className="stack-list">
          {body
            ? body.useCases.examples.map((example) => (
                <article key={example} className="stack-item">
                  <h3>{example}</h3>
                </article>
              ))
            : homeContent.useCases.examples.map((example) => (
                <article key={example.en} className="stack-item">
                  <h3>{pickText(locale, example)}</h3>
                </article>
              ))}
        </div>
      </section>

      <section className="panel hero">
        <h2>{body ? body.finalCta.title : pickText(locale, homeContent.ctaFinal.title)}</h2>
        <div className="button-row">
          <LocaleLink href="/what-is-omdala" className="site-button site-button--primary" language={locale}>
            {body ? body.finalCta.primary : pickText(locale, homeContent.ctaFinal.primary)}
          </LocaleLink>
          <LocaleLink href="/contact" className="site-button site-button--ghost" language={locale}>
            {body ? body.finalCta.secondary : pickText(locale, homeContent.ctaFinal.secondary)}
          </LocaleLink>
        </div>
      </section>
      </main>
    </WebPageShell>
  )
}
