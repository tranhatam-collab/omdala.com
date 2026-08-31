import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findOfferById, getOfferFormValue } from '@/lib/mock-data'
import { getOfferStaticParams } from '@/lib/static-params'

export const dynamicParams = false

export function generateStaticParams() {
  return getOfferStaticParams()
}

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ offerId: string }>
}) {
  const { offerId } = await params
  const offer = findOfferById(offerId)

  if (!offer) {
    notFound()
  }

  const formValue = getOfferFormValue(offer)

  return (
    <section className="dashboard-panel">
      <div className="dashboard-breadcrumbs">
        <Link href="/offers">Offers</Link>
        <span>/</span>
        <Link href={`/offers/${offer.id}`}>{offer.title}</Link>
        <span>/</span>
        <span>Edit</span>
      </div>
      <p className="app-eyebrow">Edit Offer</p>
      <h1>{offer.title}</h1>

      <form className="entity-form">
        <label>
          Node ID
          <input type="text" defaultValue={formValue.nodeId} />
        </label>
        <label>
          Resource IDs
          <input type="text" defaultValue={formValue.resourceIds} />
        </label>
        <label>
          Title
          <input type="text" defaultValue={formValue.title} />
        </label>
        <label>
          Slug
          <input type="text" defaultValue={formValue.slug} />
        </label>
        <label>
          Category
          <input type="text" defaultValue={formValue.category} />
        </label>
        <label>
          Summary
          <textarea defaultValue={formValue.summary} />
        </label>
        <label>
          Pricing mode
          <select defaultValue={formValue.pricingMode}>
            <option value="free">Free</option>
            <option value="fixed">Fixed</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label>
          Visibility
          <select defaultValue={formValue.visibility}>
            <option value="private">Private</option>
            <option value="network">Network</option>
            <option value="restricted_public">Restricted public</option>
            <option value="public">Public</option>
          </select>
        </label>
        <label>
          Minimum trust level
          <select defaultValue={formValue.minimumTrustLevel}>
            <option value="none">None</option>
            <option value="basic">Basic</option>
            <option value="verified">Verified</option>
            <option value="established">Established</option>
            <option value="trusted">Trusted</option>
          </select>
        </label>
        <div className="entity-actions">
          <button type="button" className="app-button app-button--primary">
            Save changes
          </button>
          <button type="button" className="app-button app-button--ghost danger-link">
            Archive offer
          </button>
        </div>
      </form>
    </section>
  )
}
