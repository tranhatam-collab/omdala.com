import { listMockOffers } from '@omdala/core'

export default function AdminOffersPage() {
  const offers = listMockOffers()

  return (
    <section className="admin-card">
      <p className="admin-eyebrow">Offers</p>
      <h1>Offer moderation</h1>
      <div className="admin-list">
        {offers.map((offer) => (
          <article key={offer.id} className="admin-list-item">
            <h3>{offer.title}</h3>
            <p className="admin-copy">{offer.summary}</p>
            <div className="admin-meta">
              <span>Status: {offer.status}</span>
              <span>Visibility: {offer.visibility}</span>
              <span>Minimum trust: {offer.minimumTrustLevel}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
