import type { OmdalaLanguage } from '@omdala/core'
import { WebPageShell } from '../WebPageShell'
import { getPublicPageBodyCopy, isBilingualLanguage } from '../lib/bilingual-source'
import { pickText, processContent } from '../lib/content'

export function HowItWorksPageView({ locale }: { locale: OmdalaLanguage }) {
  const body = isBilingualLanguage(locale)
    ? getPublicPageBodyCopy('howItWorks', locale)
    : null

  return (
    <WebPageShell language={locale}>
      <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{body ? body.heroEyebrow : pickText(locale, processContent.hero.eyebrow)}</p>
        <h1>{body ? body.heroTitle : pickText(locale, processContent.hero.title)}</h1>
        <p className="lead">{body ? body.heroLead : pickText(locale, processContent.hero.lead)}</p>
      </section>

      <section className="panel">
        <div className="stack-list">
          {body
            ? body.steps.map((step) => (
                <article key={step.title} className="stack-item">
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              ))
            : processContent.steps.map((step) => (
                <article key={step.title.en} className="stack-item">
                  <h3>{pickText(locale, step.title)}</h3>
                  <p>{pickText(locale, step.copy)}</p>
                </article>
              ))}
        </div>
      </section>
      </main>
    </WebPageShell>
  )
}
