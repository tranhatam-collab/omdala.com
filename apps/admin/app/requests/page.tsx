import { listMockRequests } from '@omdala/core'

export default function AdminRequestsPage() {
  const requests = listMockRequests()

  return (
    <section className="admin-card">
      <p className="admin-eyebrow">Requests</p>
      <h1>Request moderation</h1>
      <div className="admin-list">
        {requests.map((request) => (
          <article key={request.id} className="admin-list-item">
            <h3>{request.title}</h3>
            <p className="admin-copy">{request.summary}</p>
            <div className="admin-meta">
              <span>Status: {request.status}</span>
              <span>Urgency: {request.urgency}</span>
              <span>Visibility: {request.visibility}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
