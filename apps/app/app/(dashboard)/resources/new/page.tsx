import Link from 'next/link'
import { getResourceDraft } from '@/lib/mock-data'

export default function NewResourcePage() {
  const draft = getResourceDraft()

  return (
    <section className="dashboard-panel">
      <div className="dashboard-breadcrumbs">
        <Link href="/resources">Resources</Link>
        <span>/</span>
        <span>New</span>
      </div>
      <p className="app-eyebrow">Create Resource</p>
      <h1>New resource draft</h1>
      <p className="app-copy">
        This form locks the create flow for resource records before persistence and validation are connected.
      </p>

      <form className="entity-form">
        <label>
          Node ID
          <input type="text" defaultValue={draft.nodeId} />
        </label>
        <label>
          Title
          <input type="text" defaultValue={draft.title} placeholder="Resource title" />
        </label>
        <label>
          Slug
          <input type="text" defaultValue={draft.slug} placeholder="resource-slug" />
        </label>
        <label>
          Resource type
          <select defaultValue={draft.resourceType}>
            <option value="time">Time</option>
            <option value="space">Space</option>
            <option value="skill">Skill</option>
            <option value="service">Service</option>
            <option value="knowledge">Knowledge</option>
            <option value="asset">Asset</option>
          </select>
        </label>
        <label>
          Description
          <textarea defaultValue={draft.description} placeholder="Describe the resource clearly." />
        </label>
        <label>
          Availability mode
          <select defaultValue={draft.availabilityMode}>
            <option value="flexible">Flexible</option>
            <option value="scheduled">Scheduled</option>
            <option value="limited">Limited</option>
          </select>
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
        <div className="entity-actions">
          <button type="button" className="app-button app-button--primary">
            Save draft
          </button>
          <Link href="/resources" className="app-button app-button--ghost">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}
