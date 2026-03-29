'use client'

import { LocaleLink } from './components/LocaleLink'
import { homeContent, pickText } from './lib/content'
import { getPublicRuntimeSnapshot } from './lib/runtime-seed'
import { useWebLocale } from './lib/useWebLocale'

export default function HomePage() {
  const locale = useWebLocale()
  const runtime = getPublicRuntimeSnapshot()

  return (
    <main className="site-shell page-shell">
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

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, homeContent.platformLogic.eyebrow)}</p>
          <h2>{pickText(locale, homeContent.platformLogic.title)}</h2>
          <p className="section-copy">{pickText(locale, homeContent.platformLogic.copy)}</p>
        </div>

        <div className="metric-grid">
          {homeContent.platformLogic.metrics.map((item) => (
            <article key={item.title.en} className="metric-card">
              <strong>{pickText(locale, item.title)}</strong>
              <p>{pickText(locale, item.copy)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, homeContent.operators.eyebrow)}</p>
          <h2>{pickText(locale, homeContent.operators.title)}</h2>
          <p className="section-copy">{pickText(locale, homeContent.operators.copy)}</p>
        </div>

        <div className="card-grid">
          {homeContent.operators.cards.map((card) => (
            <article key={card.title.en}>
              <h3>{pickText(locale, card.title)}</h3>
              <p>{pickText(locale, card.copy)}</p>
            </article>
          ))}
        </div>

        <div className="page-links">
          <LocaleLink href="/for-experts">{pickText(locale, { en: 'For experts', vi: 'Cho chuyên gia' })}</LocaleLink>
          <LocaleLink href="/for-hosts">{pickText(locale, { en: 'For hosts', vi: 'Cho điểm đón' })}</LocaleLink>
          <LocaleLink href="/for-communities">{pickText(locale, { en: 'For communities', vi: 'Cho cộng đồng' })}</LocaleLink>
        </div>
      </section>

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

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, homeContent.surfaces.eyebrow)}</p>
          <h2>{pickText(locale, homeContent.surfaces.title)}</h2>
        </div>

        <div className="card-grid">
          {homeContent.surfaces.cards.map((card) => (
            <article key={card.label}>
              <h3>{card.label}</h3>
              <p>{pickText(locale, card.copy)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, { en: 'Runtime Signals', vi: 'Tín hiệu runtime' })}</p>
          <h2>{pickText(locale, { en: 'Structured mock data now powers public routes', vi: 'Dữ liệu mock có cấu trúc đang vận hành các route public' })}</h2>
        </div>

        <div className="metric-grid">
          {homeContent.mockSignals.map((signal) => (
            <article key={signal.label.en} className="metric-card">
              <strong>{signal.metric}</strong>
              <h3>{pickText(locale, signal.label)}</h3>
              <p>{pickText(locale, signal.detail)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, { en: 'Live Seed Snapshot', vi: 'Ảnh chụp seed đang chạy' })}</p>
          <h2>{pickText(locale, { en: 'Public runtime now reads shared seeded objects', vi: 'Runtime public đang đọc object seed dùng chung' })}</h2>
        </div>

        <div className="metric-grid">
          {runtime.counters.map((item) => (
            <article key={item.key} className="metric-card">
              <strong>{item.metric}</strong>
              <p>{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{pickText(locale, { en: 'Seeded Marketplace', vi: 'Marketplace seed' })}</p>
          <h2>{pickText(locale, { en: 'Featured offers and requests from runtime data', vi: 'Đề nghị và nhu cầu nổi bật từ dữ liệu runtime' })}</h2>
        </div>

        <div className="card-grid">
          {runtime.featuredOffers.map((offer) => (
            <article key={offer.id}>
              <h3>{offer.title}</h3>
              <p>{offer.summary}</p>
              <p>
                {pickText(locale, { en: 'Status', vi: 'Trạng thái' })}: <strong>{offer.status}</strong> ·{' '}
                {pickText(locale, { en: 'Min trust', vi: 'Niềm tin tối thiểu' })}: <strong>{offer.minimumTrustLevel}</strong>
              </p>
            </article>
          ))}
          {runtime.featuredRequests.map((request) => (
            <article key={request.id}>
              <h3>{request.title}</h3>
              <p>{request.summary}</p>
              <p>
                {pickText(locale, { en: 'Urgency', vi: 'Độ khẩn' })}: <strong>{request.urgency}</strong> ·{' '}
                {pickText(locale, { en: 'Status', vi: 'Trạng thái' })}: <strong>{request.status}</strong>
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
