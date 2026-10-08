import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findNodeById, findOfferById } from '@/lib/mock-data'
import { getOfferStaticParams } from '@/lib/static-params'

export const dynamicParams = false

export function generateStaticParams() {
  return getOfferStaticParams()
}

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ offerId: string }>
}) {
  const { offerId } = await params
  const offer = findOfferById(offerId)

  if (!offer) {
    notFound()
  }

  const node = findNodeById(offer.nodeId)

  return (
    <section className="dashboard-panel">
      <div className="dashboard-breadcrumbs">
        <Link href="/offers">Offers</Link>
        <span>/</span>
        <span>{offer.title}</span>
      </div>
      <p className="app-eyebrow">{offer.category}</p>
      <h1>{offer.title}</h1>
      <p className="app-copy">{offer.summary}</p>

      <div className="pill-row">
        <span className="app-pill">{offer.status}</span>
        <span className="app-pill">{offer.visibility}</span>
        <span className="app-pill">Min trust: {offer.minimumTrustLevel}</span>
      </div>

      <div className="detail-meta">
        <span>Node: {node?.name ?? offer.nodeId}</span>
        <span>Pricing: {offer.pricingMode}</span>
        <span>Resource IDs: {offer.resourceIds.join(', ')}</span>
      </div>

      <div className="detail-actions">
        <Link href={`/offers/${offer.id}/edit`} className="app-button app-button--primary">
          Edit offer
        </Link>
      </div>
    </section>
  )
}
