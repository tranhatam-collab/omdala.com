import { listMockNodes } from '@omdala/core'

export default function AdminNodesPage() {
  const nodes = listMockNodes()

  return (
    <section className="admin-card">
      <p className="admin-eyebrow">Nodes</p>
      <h1>Node moderation</h1>
      <div className="admin-list">
        {nodes.map((node) => (
          <article key={node.id} className="admin-list-item">
            <h3>{node.name}</h3>
            <p className="admin-copy">{node.summary}</p>
            <div className="admin-meta">
              <span>Role: {node.primaryRole}</span>
              <span>Verification: {node.verificationStatus}</span>
              <span>Trust: {node.trustLevel}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
