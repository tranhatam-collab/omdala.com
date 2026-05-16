import Link from 'next/link'
import { getOfferDraft } from '@/lib/mock-data'

export default function NewOfferPage() {
  const draft = getOfferDraft()

  return (
    <section className="dashboard-panel">
      <div className="dashboard-breadcrumbs">
        <Link href="/offers">Offers</Link>
        <span>/</span>
        <span>New</span>
      </div>
      <p className="app-eyebrow">Create Offer</p>
      <h1>New offer draft</h1>
      <p className="app-copy">
        This form locks the minimum shape for publishing value outward from a node and its resources.
      </p>

      <form className="entity-form">
        <label>
          Node ID
          <input type="text" defaultValue={draft.nodeId} />
        </label>
        <label>
          Resource IDs
          <input type="text" defaultValue={draft.resourceIds} placeholder="resource-a, resource-b" />
        </label>
        <label>
          Title
          <input type="text" defaultValue={draft.title} />
        </label>
        <label>
          Slug
          <input type="text" defaultValue={draft.slug} />
        </label>
        <label>
          Category
          <input type="text" defaultValue={draft.category} placeholder="advisory, hosting, workshop..." />
        </label>
        <label>
          Summary
          <textarea defaultValue={draft.summary} />
        </label>
        <label>
          Pricing mode
          <select defaultValue={draft.pricingMode}>
            <option value="free">Free</option>
            <option value="fixed">Fixed</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label>
          Visibility
          <select defaultValue={draft.visibility}>
            <option value="private">Private</option>
            <option value="network">Network</option>
            <option value="restricted_public">Restricted public</option>
            <option value="public">Public</option>
          </select>
        </label>
        <label>
          Minimum trust level
          <select defaultValue={draft.minimumTrustLevel}>
            <option value="none">None</option>
            <option value="basic">Basic</option>
            <option value="verified">Verified</option>
            <option value="established">Established</option>
            <option value="trusted">Trusted</option>
          </select>
        </label>
        <div className="entity-actions">
          <button type="button" className="app-button app-button--primary">
            Save draft
          </button>
          <Link href="/offers" className="app-button app-button--ghost">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}
