import { listModerationCases } from '@omdala/core'
import { ADMIN_COPY, resolveAdminLanguage, t } from '../lib/admin-copy'

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const cases = listModerationCases().filter((item) =>
    item.subjectType === 'node' || item.subjectType === 'proof'
  )
  const language = await resolveAdminLanguage(searchParams)

  return (
    <section className="admin-card">
      <p className="admin-eyebrow">{t(language, ADMIN_COPY.verifications.eyebrow)}</p>
      <h1>{t(language, ADMIN_COPY.verifications.title)}</h1>
      <div className="admin-list">
        {cases.map((item) => (
          <article key={item.id} className="admin-list-item">
            <h3>{item.title}</h3>
            <p className="admin-copy">{item.summary}</p>
            <div className="admin-meta">
              <span>{t(language, ADMIN_COPY.verifications.severity)}: {item.severity}</span>
              <span>{t(language, ADMIN_COPY.verifications.action)}: {item.actionHint}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
