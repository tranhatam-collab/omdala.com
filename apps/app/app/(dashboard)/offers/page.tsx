import Link from 'next/link'
import { getOfferWorkspace } from '@/lib/runtime-data'

export default function OffersPage() {
  const offerWorkspace = getOfferWorkspace()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Offer Runtime</p>
        <h1>Offers</h1>
        <p className="app-copy">
          Offers now run on seeded object relationships across node ownership, linked resources, and
          trust-backed readiness scores.
        </p>
        <div className="entity-actions">
          <Link href="/offers/new" className="app-button app-button--primary">
            Create offer
          </Link>
        </div>
      </section>

      <section className="entity-grid">
        {offerWorkspace.map(({ offer, owner, linkedResources, proofDensity, readinessScore, readinessBand }) => (
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
              <span>Node: {owner?.name ?? offer.nodeId}</span>
              <span>Pricing: {offer.pricingMode}</span>
              <span>Resources linked: {linkedResources.length}</span>
              <span>Proof density: {proofDensity}</span>
              <span>Readiness: {readinessScore} ({readinessBand})</span>
            </div>
            <div className="entity-actions">
              <Link href={`/offers/${offer.id}`}>View</Link>
              <Link href={`/offers/${offer.id}/edit`}>Edit</Link>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}
