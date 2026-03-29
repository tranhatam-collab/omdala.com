import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSuggestedMatchesForNode } from '@omdala/matching-service'
import { getNodeTrustSummary } from '@omdala/trust-service'
import { findNodeById, listResourcesForNode } from '@/lib/mock-data'

export default async function NodeDetailPage({
  params,
}: {
  params: Promise<{ nodeId: string }>
}) {
  const { nodeId } = await params
  const node = findNodeById(nodeId)

  if (!node) {
    notFound()
  }

  const resources = listResourcesForNode(node.id)
  const trust = getNodeTrustSummary(node)
  const matches = getSuggestedMatchesForNode(node, resources)

  return (
    <>
      <div className="dashboard-breadcrumbs">
        <Link href="/nodes">Nodes</Link>
        <span>/</span>
        <span>{node.name}</span>
      </div>

      <section className="detail-layout">
        <article className="dashboard-panel">
          <p className="app-eyebrow">{node.nodeType}</p>
          <h1>{node.name}</h1>
          <p className="app-copy">{node.summary}</p>

          <div className="pill-row">
            <span className="app-pill">{node.primaryRole}</span>
            <span className="app-pill">{node.visibility}</span>
            <span className="app-pill">{node.status}</span>
          </div>

          <div className="detail-meta">
            <span>Location: {node.locationText}</span>
            <span>Verification: {node.verificationStatus}</span>
            <span>Resources linked: {resources.length}</span>
          </div>

          <div className="detail-actions">
            <Link href={`/nodes/${node.id}/edit`} className="app-button app-button--primary">
              Edit node
            </Link>
            <Link href="/resources" className="app-button app-button--ghost">
              View resources
            </Link>
          </div>
        </article>

        <aside className="dashboard-main">
          <section className="detail-card">
            <p className="app-eyebrow">Trust</p>
            <h2>{trust.level}</h2>
            <ul className="dashboard-list">
              <li>Score: {trust.overallScore}</li>
              <li>Highlights: {trust.highlights.join(' ')}</li>
              <li>Blockers: {trust.blockers.join(' ')}</li>
            </ul>
          </section>

          <section className="detail-card">
            <p className="app-eyebrow">Matching</p>
            <ul className="dashboard-list">
              {matches.map((match) => (
                <li key={match.id}>
                  {match.title} ({match.score}) — {match.summary}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </>
  )
}
