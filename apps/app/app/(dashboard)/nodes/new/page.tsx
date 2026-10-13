import Link from 'next/link'
import { getNodeDraft } from '@/lib/mock-data'

export default function NewNodePage() {
  const draft = getNodeDraft()

  return (
    <section className="dashboard-panel">
      <div className="dashboard-breadcrumbs">
        <Link href="/nodes">Nodes</Link>
        <span>/</span>
        <span>New</span>
      </div>
      <p className="app-eyebrow">Create Node</p>
      <h1>New node draft</h1>
      <p className="app-copy">
        This form locks the create flow fields before persistence is wired to the real backend.
      </p>

      <form className="entity-form">
        <label>
          Name
          <input type="text" defaultValue={draft.name} placeholder="Node name" />
        </label>
        <label>
          Slug
          <input type="text" defaultValue={draft.slug} placeholder="node-slug" />
        </label>
        <label>
          Node type
          <select defaultValue={draft.nodeType}>
            <option value="person">Person</option>
            <option value="team">Team</option>
            <option value="business">Business</option>
            <option value="place">Place</option>
            <option value="community">Community</option>
          </select>
        </label>
        <label>
          Primary role
          <select defaultValue={draft.primaryRole}>
            <option value="expert">Expert</option>
            <option value="host">Host</option>
            <option value="community">Community</option>
            <option value="business">Business</option>
          </select>
        </label>
        <label>
          Summary
          <textarea defaultValue={draft.summary} placeholder="Describe the node and its purpose." />
        </label>
        <label>
          Location
          <input type="text" defaultValue={draft.locationText} placeholder="City, country, or remote" />
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
          <Link href="/nodes" className="app-button app-button--ghost">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}
