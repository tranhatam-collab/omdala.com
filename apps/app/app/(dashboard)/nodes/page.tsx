import Link from 'next/link'
import { getNodeWorkspace } from '@/lib/runtime-data'

export default function NodesPage() {
  const nodeWorkspace = getNodeWorkspace()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Node Runtime</p>
        <h1>Nodes</h1>
        <p className="app-copy">
          Nodes are now backed by a structured runtime graph that merges identity, trust score,
          resource density, and match recommendations in one surface.
        </p>
        <div className="entity-actions">
          <Link href="/nodes/new" className="app-button app-button--primary">
            Create node
          </Link>
        </div>
      </section>

      <section className="entity-grid">
        {nodeWorkspace.map(({ node, trust, stats, readinessScore, readinessBand, nextMatches }) => (
          <article key={node.id} className="entity-card">
            <p className="app-eyebrow">{node.nodeType}</p>
            <h2>{node.name}</h2>
            <p className="app-copy">{node.summary}</p>
            <div className="pill-row">
              <span className="app-pill">{node.primaryRole}</span>
              <span className="app-pill">{node.visibility}</span>
              <span className="app-pill">trust:{trust.level}</span>
            </div>
            <div className="entity-meta">
              <span>Location: {node.locationText}</span>
              <span>Resources: {stats.resources}</span>
              <span>Offers: {stats.offers}</span>
              <span>Open requests: {stats.openRequests}</span>
              <span>Readiness: {readinessScore} ({readinessBand})</span>
            </div>
            <ul className="dashboard-list">
              {nextMatches.map((suggestion) => (
                <li key={suggestion.id}>
                  {suggestion.title} ({suggestion.score})
                </li>
              ))}
            </ul>
            <div className="entity-actions">
              <Link href={`/nodes/${node.id}`}>View</Link>
              <Link href={`/nodes/${node.id}/edit`}>Edit</Link>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}
