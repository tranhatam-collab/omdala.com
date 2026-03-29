import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findResourceById, getResourceFormValue } from '@/lib/mock-data'

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ resourceId: string }>
}) {
  const { resourceId } = await params
  const resource = findResourceById(resourceId)

  if (!resource) {
    notFound()
  }

  const formValue = getResourceFormValue(resource)

  return (
    <section className="dashboard-panel">
      <div className="dashboard-breadcrumbs">
        <Link href="/resources">Resources</Link>
        <span>/</span>
        <Link href={`/resources/${resource.id}`}>{resource.title}</Link>
        <span>/</span>
        <span>Edit</span>
      </div>
      <p className="app-eyebrow">Edit Resource</p>
      <h1>{resource.title}</h1>

      <form className="entity-form">
        <label>
          Node ID
          <input type="text" defaultValue={formValue.nodeId} />
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
          Resource type
          <select defaultValue={formValue.resourceType}>
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
          <textarea defaultValue={formValue.description} />
        </label>
        <label>
          Availability mode
          <select defaultValue={formValue.availabilityMode}>
            <option value="flexible">Flexible</option>
            <option value="scheduled">Scheduled</option>
            <option value="limited">Limited</option>
          </select>
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
        <div className="entity-actions">
          <button type="button" className="app-button app-button--primary">
            Save changes
          </button>
          <button type="button" className="app-button app-button--ghost danger-link">
            Archive resource
          </button>
        </div>
      </form>
    </section>
  )
}
