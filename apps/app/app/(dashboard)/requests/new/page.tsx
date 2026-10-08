import Link from 'next/link'
import { getRequestDraft } from '@/lib/mock-data'

export default function NewRequestPage() {
  const draft = getRequestDraft()

  return (
    <section className="dashboard-panel">
      <div className="dashboard-breadcrumbs">
        <Link href="/requests">Requests</Link>
        <span>/</span>
        <span>New</span>
      </div>
      <p className="app-eyebrow">Create Request</p>
      <h1>New request draft</h1>
      <p className="app-copy">
        This form defines the minimum structure for incoming demand before backend persistence is wired.
      </p>

      <form className="entity-form">
        <label>
          Node ID
          <input type="text" defaultValue={draft.nodeId} />
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
          <input type="text" defaultValue={draft.category} />
        </label>
        <label>
          Summary
          <textarea defaultValue={draft.summary} />
        </label>
        <label>
          Urgency
          <select defaultValue={draft.urgency}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
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
          Budget hint
          <input type="text" defaultValue={draft.budgetHint} />
        </label>
        <div className="entity-actions">
          <button type="button" className="app-button app-button--primary">
            Save draft
          </button>
          <Link href="/requests" className="app-button app-button--ghost">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}
