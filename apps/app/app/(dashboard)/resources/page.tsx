import Link from 'next/link'
import { listMockResources, listMockNodes } from '@/lib/mock-data'

export default function ResourcesPage() {
  const resources = listMockResources()
  const nodes = listMockNodes()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Resource CRUD</p>
        <h1>Resources</h1>
        <p className="app-copy">
          Resources are the units that become offers, actions, or coordination inputs. This shell now
          supports list, create, detail, and edit routing.
        </p>
        <div className="entity-actions">
          <Link href="/resources/new" className="app-button app-button--primary">
            Create resource
          </Link>
        </div>
      </section>

      <section className="entity-grid">
        {resources.map((resource) => {
          const node = nodes.find((item) => item.id === resource.nodeId)

          return (
            <article key={resource.id} className="entity-card">
              <p className="app-eyebrow">{resource.resourceType}</p>
              <h2>{resource.title}</h2>
              <p className="app-copy">{resource.description}</p>
              <div className="pill-row">
                <span className="app-pill">{resource.availabilityMode}</span>
                <span className="app-pill">{resource.pricingMode}</span>
                <span className="app-pill">{resource.status}</span>
              </div>
              <div className="entity-meta">
                <span>Node: {node?.name ?? resource.nodeId}</span>
                <span>Visibility: {resource.visibility}</span>
                <span>Trust proofs: {resource.proofCount}</span>
              </div>
              <div className="entity-actions">
                <Link href={`/resources/${resource.id}`}>View</Link>
                <Link href={`/resources/${resource.id}/edit`}>Edit</Link>
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}
