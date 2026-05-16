import { listMockRequests } from '@omdala/core'
import { ADMIN_COPY, resolveAdminLanguage, t } from '../lib/admin-copy'

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const requests = listMockRequests()
  const language = await resolveAdminLanguage(searchParams)

  return (
    <section className="admin-card">
      <p className="admin-eyebrow">{t(language, ADMIN_COPY.requests.eyebrow)}</p>
      <h1>{t(language, ADMIN_COPY.requests.title)}</h1>
      <div className="admin-list">
        {requests.map((request) => (
          <article key={request.id} className="admin-list-item">
            <h3>{request.title}</h3>
            <p className="admin-copy">{request.summary}</p>
            <div className="admin-meta">
              <span>{t(language, ADMIN_COPY.requests.status)}: {request.status}</span>
              <span>{t(language, ADMIN_COPY.requests.urgency)}: {request.urgency}</span>
              <span>{t(language, ADMIN_COPY.requests.visibility)}: {request.visibility}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
