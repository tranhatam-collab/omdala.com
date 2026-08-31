import Link from 'next/link'
import { getRequestWorkspace } from '@/lib/runtime-data'

export default function RequestsPage() {
  const requestWorkspace = getRequestWorkspace()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Request Runtime</p>
        <h1>Requests</h1>
        <p className="app-copy">
          Requests now use seeded matching context with owner node mapping and candidate offer density to
          prioritize execution flow.
        </p>
        <div className="entity-actions">
          <Link href="/requests/new" className="app-button app-button--primary">
            Create request
          </Link>
        </div>
      </section>

      <section className="entity-grid">
        {requestWorkspace.map(({ request, owner, candidateOffers, matchingReadiness, readinessBand }) => (
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
              <span>Node: {owner?.name ?? request.nodeId}</span>
              <span>Budget: {request.budgetHint}</span>
              <span>Candidate offers: {candidateOffers.length}</span>
              <span>Match readiness: {matchingReadiness} ({readinessBand})</span>
            </div>
            <div className="entity-actions">
              <Link href={`/requests/${request.id}`}>View</Link>
              <Link href={`/requests/${request.id}/edit`}>Edit</Link>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}
