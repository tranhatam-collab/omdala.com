import type { OmdalaLanguage } from '@omdala/core'
import { WebPageShell } from '../WebPageShell'
import { getPublicPageBodyCopy, isBilingualLanguage } from '../lib/bilingual-source'
import { pickText, visionContent } from '../lib/content'

export function VisionPageView({ locale }: { locale: OmdalaLanguage }) {
  const body = isBilingualLanguage(locale)
    ? getPublicPageBodyCopy('vision', locale)
    : null

  return (
    <WebPageShell language={locale}>
      <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{body ? body.heroEyebrow : pickText(locale, visionContent.hero.eyebrow)}</p>
        <h1>{body ? body.heroTitle : pickText(locale, visionContent.hero.title)}</h1>
        <p className="lead">{body ? body.heroLead : pickText(locale, visionContent.hero.lead)}</p>
      </section>

      <section className="panel">
        <div className="stack-list">
          {body
            ? body.horizons.map((horizon) => (
                <article key={horizon.title} className="stack-item">
                  <h3>{horizon.title}</h3>
                  <p>{horizon.copy}</p>
                </article>
              ))
            : visionContent.horizons.map((horizon) => (
                <article key={horizon.title.en} className="stack-item">
                  <h3>{pickText(locale, horizon.title)}</h3>
                  <p>{pickText(locale, horizon.copy)}</p>
                </article>
              ))}
        </div>
      </section>
      </main>
    </WebPageShell>
  )
}
