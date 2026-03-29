import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findRequestById, getRequestFormValue } from '@/lib/mock-data'

export default async function EditRequestPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = await params
  const request = findRequestById(requestId)

  if (!request) {
    notFound()
  }

  const formValue = getRequestFormValue(request)

  return (
    <section className="dashboard-panel">
      <div className="dashboard-breadcrumbs">
        <Link href="/requests">Requests</Link>
        <span>/</span>
        <Link href={`/requests/${request.id}`}>{request.title}</Link>
        <span>/</span>
        <span>Edit</span>
      </div>
      <p className="app-eyebrow">Edit Request</p>
      <h1>{request.title}</h1>

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
          Category
          <input type="text" defaultValue={formValue.category} />
        </label>
        <label>
          Summary
          <textarea defaultValue={formValue.summary} />
        </label>
        <label>
          Urgency
          <select defaultValue={formValue.urgency}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
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
          Budget hint
          <input type="text" defaultValue={formValue.budgetHint} />
        </label>
        <div className="entity-actions">
          <button type="button" className="app-button app-button--primary">
            Save changes
          </button>
          <button type="button" className="app-button app-button--ghost danger-link">
            Archive request
          </button>
        </div>
      </form>
    </section>
  )
}
