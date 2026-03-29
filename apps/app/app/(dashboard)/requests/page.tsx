import Link from 'next/link'
import { listMockNodes, listMockRequests } from '@/lib/mock-data'

export default function RequestsPage() {
  const requests = listMockRequests()
  const nodes = listMockNodes()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Request Flow</p>
        <h1>Requests</h1>
        <p className="app-copy">
          Requests capture structured need. This shell now supports list, create, detail, and edit flows.
        </p>
        <div className="entity-actions">
          <Link href="/requests/new" className="app-button app-button--primary">
            Create request
          </Link>
        </div>
      </section>

      <section className="entity-grid">
        {requests.map((request) => {
          const node = nodes.find((item) => item.id === request.nodeId)

          return (
            <article key={request.id} className="entity-card">
              <p className="app-eyebrow">{request.category}</p>
              <h2>{request.title}</h2>
              <p className="app-copy">{request.summary}</p>
              <div className="pill-row">
                <span className="app-pill">{request.status}</span>
                <span className="app-pill">{request.visibility}</span>
                <span className="app-pill">Urgency: {request.urgency}</span>
              </div>
              <div className="entity-meta">
                <span>Node: {node?.name ?? request.nodeId}</span>
                <span>Budget: {request.budgetHint}</span>
              </div>
              <div className="entity-actions">
                <Link href={`/requests/${request.id}`}>View</Link>
                <Link href={`/requests/${request.id}/edit`}>Edit</Link>
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}
