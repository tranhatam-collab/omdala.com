import Link from 'next/link'
import { getResourceWorkspace } from '@/lib/runtime-data'

export default function ResourcesPage() {
  const resourceWorkspace = getResourceWorkspace()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Resource Runtime</p>
        <h1>Resources</h1>
        <p className="app-copy">
          Resources now run through trust + matching pipelines. Each card shows owner context, trust
          score, and activation suggestions for the next action.
        </p>
        <div className="entity-actions">
          <Link href="/resources/new" className="app-button app-button--primary">
            Create resource
          </Link>
        </div>
      </section>

      <section className="entity-grid">
        {resourceWorkspace.map(({ resource, owner, trust, suggestions, trustBand }) => (
          <article key={resource.id} className="entity-card">
            <p className="app-eyebrow">{resource.resourceType}</p>
            <h2>{resource.title}</h2>
            <p className="app-copy">{resource.description}</p>
            <div className="pill-row">
              <span className="app-pill">{resource.availabilityMode}</span>
              <span className="app-pill">{resource.pricingMode}</span>
              <span className="app-pill">{resource.status}</span>
              <span className="app-pill">trust:{trust.level}</span>
            </div>
            <div className="entity-meta">
              <span>Node: {owner?.name ?? resource.nodeId}</span>
              <span>Visibility: {resource.visibility}</span>
              <span>Proofs: {resource.proofCount}</span>
              <span>Trust score: {trust.overallScore} ({trustBand})</span>
            </div>
            <ul className="dashboard-list">
              {suggestions.slice(0, 2).map((suggestion) => (
                <li key={suggestion.id}>
                  {suggestion.title} ({suggestion.score})
                </li>
              ))}
            </ul>
            <div className="entity-actions">
              <Link href={`/resources/${resource.id}`}>View</Link>
              <Link href={`/resources/${resource.id}/edit`}>Edit</Link>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}
