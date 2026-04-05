import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSuggestedMatchesForResource } from '@omdala/matching-service'
import { getResourceTrustSummary } from '@omdala/trust-service'
import { findNodeById, findResourceById } from '@/lib/mock-data'
import { getResourceStaticParams } from '@/lib/static-params'

export const dynamicParams = false

export function generateStaticParams() {
  return getResourceStaticParams()
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ resourceId: string }>
}) {
  const { resourceId } = await params
  const resource = findResourceById(resourceId)

  if (!resource) {
    notFound()
  }

  const node = findNodeById(resource.nodeId)

  if (!node) {
    notFound()
  }

  const trust = getResourceTrustSummary(resource)
  const matches = getSuggestedMatchesForResource(resource, node)

  return (
    <>
      <div className="dashboard-breadcrumbs">
        <Link href="/resources">Resources</Link>
        <span>/</span>
        <span>{resource.title}</span>
      </div>

      <section className="detail-layout">
        <article className="dashboard-panel">
          <p className="app-eyebrow">{resource.resourceType}</p>
          <h1>{resource.title}</h1>
          <p className="app-copy">{resource.description}</p>

          <div className="pill-row">
            <span className="app-pill">{resource.availabilityMode}</span>
            <span className="app-pill">{resource.pricingMode}</span>
            <span className="app-pill">{resource.status}</span>
          </div>

          <div className="detail-meta">
            <span>Owner node: {node.name}</span>
            <span>Visibility: {resource.visibility}</span>
            <span>Utilization hint: {resource.utilizationHint}</span>
          </div>

          <div className="detail-actions">
            <Link href={`/resources/${resource.id}/edit`} className="app-button app-button--primary">
              Edit resource
            </Link>
            <Link href={`/nodes/${node.id}`} className="app-button app-button--ghost">
              View owner node
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
