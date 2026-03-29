import Link from 'next/link'
import { listMockNodes, listMockOffers } from '@/lib/mock-data'

export default function OffersPage() {
  const offers = listMockOffers()
  const nodes = listMockNodes()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Offer Flow</p>
        <h1>Offers</h1>
        <p className="app-copy">
          Offers convert node and resource capacity into structured outward value. This flow now
          supports list, create, detail, and edit shells.
        </p>
        <div className="entity-actions">
          <Link href="/offers/new" className="app-button app-button--primary">
            Create offer
          </Link>
        </div>
      </section>

      <section className="entity-grid">
        {offers.map((offer) => {
          const node = nodes.find((item) => item.id === offer.nodeId)

          return (
            <article key={offer.id} className="entity-card">
              <p className="app-eyebrow">{offer.category}</p>
              <h2>{offer.title}</h2>
              <p className="app-copy">{offer.summary}</p>
              <div className="pill-row">
                <span className="app-pill">{offer.status}</span>
                <span className="app-pill">{offer.visibility}</span>
                <span className="app-pill">Min trust: {offer.minimumTrustLevel}</span>
              </div>
              <div className="entity-meta">
                <span>Node: {node?.name ?? offer.nodeId}</span>
                <span>Pricing: {offer.pricingMode}</span>
                <span>Resources linked: {offer.resourceIds.length}</span>
              </div>
              <div className="entity-actions">
                <Link href={`/offers/${offer.id}`}>View</Link>
                <Link href={`/offers/${offer.id}/edit`}>Edit</Link>
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}
