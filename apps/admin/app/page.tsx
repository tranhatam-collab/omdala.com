import Link from 'next/link'
import { listModerationCases } from '@omdala/core'
import { ADMIN_COPY, resolveAdminLanguage, t } from './lib/admin-copy'

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const cases = listModerationCases()
  const openCases = cases.filter((item) => item.status === 'open')
  const highSeverity = openCases.filter((item) => item.severity === 'high')
  const language = await resolveAdminLanguage(searchParams)

  return (
    <>
      <section className="admin-card">
        <p className="admin-eyebrow">{t(language, ADMIN_COPY.overview.eyebrow)}</p>
        <h1>{t(language, ADMIN_COPY.overview.title)}</h1>
        <p className="admin-copy">{t(language, ADMIN_COPY.overview.intro)}</p>
      </section>

      <section className="admin-grid">
        <article className="admin-stat">
          <strong>{t(language, ADMIN_COPY.overview.openCases)}</strong>
          <p>{openCases.length}</p>
        </article>
        <article className="admin-stat">
          <strong>{t(language, ADMIN_COPY.overview.highSeverity)}</strong>
          <p>{highSeverity.length}</p>
        </article>
        <article className="admin-stat">
          <strong>{t(language, ADMIN_COPY.overview.nextReviewArea)}</strong>
          <p>{t(language, ADMIN_COPY.overview.nextReviewAreaBody)}</p>
        </article>
      </section>

      <section className="admin-card">
        <h2>{t(language, ADMIN_COPY.overview.currentQueue)}</h2>
        <div className="admin-list">
          {openCases.map((item) => (
            <article key={item.id} className="admin-list-item">
              <p className="admin-eyebrow">{item.subjectType}</p>
              <h3>{item.title}</h3>
              <p className="admin-copy">{item.summary}</p>
              <div className="admin-meta">
                <span>{t(language, ADMIN_COPY.overview.severity)}: {item.severity}</span>
                <span>{t(language, ADMIN_COPY.overview.action)}: {item.actionHint}</span>
              </div>
            </article>
          ))}
        </div>
        <div className="admin-links">
          <Link href="/offers">{t(language, ADMIN_COPY.overview.reviewOffers)}</Link>
          <Link href="/requests">{t(language, ADMIN_COPY.overview.reviewRequests)}</Link>
          <Link href="/proofs">{t(language, ADMIN_COPY.overview.reviewProofs)}</Link>
        </div>
      </section>
    </>
  )
}
