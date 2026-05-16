import type { OmdalaLanguage } from '@omdala/core'
import { WebPageShell } from '../WebPageShell'
import { getPublicPageBodyCopy, isBilingualLanguage } from '../lib/bilingual-source'
import { audiencePages, pickText } from '../lib/content'

export function ForHostsPageView({ locale }: { locale: OmdalaLanguage }) {
  const legacyContent = audiencePages.hosts
  const body = isBilingualLanguage(locale)
    ? getPublicPageBodyCopy('forHosts', locale)
    : null

  return (
    <WebPageShell language={locale}>
      <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{body ? body.heroEyebrow : pickText(locale, legacyContent.hero.eyebrow)}</p>
        <h1>{body ? body.heroTitle : pickText(locale, legacyContent.hero.title)}</h1>
        <p className="lead">{body ? body.heroLead : pickText(locale, legacyContent.hero.lead)}</p>
      </section>

      <section className="panel">
        <ul className="feature-list">
          {body
            ? body.items.map((item) => <li key={item}>{item}</li>)
            : legacyContent.items.map((item) => (
                <li key={item.en}>{pickText(locale, item)}</li>
              ))}
        </ul>
      </section>
      </main>
    </WebPageShell>
  )
}
