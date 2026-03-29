import Link from 'next/link'
import { listMockNodes } from '@/lib/mock-data'

export default function NodesPage() {
  const nodes = listMockNodes()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Node CRUD</p>
        <h1>Nodes</h1>
        <p className="app-copy">
          Nodes are the core operational units of OMDALA. This shell now supports list, create,
          detail, and edit routing for the next implementation phase.
        </p>
        <div className="entity-actions">
          <Link href="/nodes/new" className="app-button app-button--primary">
            Create node
          </Link>
        </div>
      </section>

      <section className="entity-grid">
        {nodes.map((node) => (
          <article key={node.id} className="entity-card">
            <p className="app-eyebrow">{node.nodeType}</p>
            <h2>{node.name}</h2>
            <p className="app-copy">{node.summary}</p>
            <div className="pill-row">
              <span className="app-pill">{node.primaryRole}</span>
              <span className="app-pill">{node.trustLevel}</span>
              <span className="app-pill">{node.visibility}</span>
            </div>
            <div className="entity-meta">
              <span>Location: {node.locationText}</span>
              <span>Resources: {node.resourceCount}</span>
              <span>Proofs: {node.proofCount}</span>
            </div>
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
