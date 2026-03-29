import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findNodeById, getNodeFormValue } from '@/lib/mock-data'

export default async function EditNodePage({
  params,
}: {
  params: Promise<{ nodeId: string }>
}) {
  const { nodeId } = await params
  const node = findNodeById(nodeId)

  if (!node) {
    notFound()
  }

  const formValue = getNodeFormValue(node)

  return (
    <section className="dashboard-panel">
      <div className="dashboard-breadcrumbs">
        <Link href="/nodes">Nodes</Link>
        <span>/</span>
        <Link href={`/nodes/${node.id}`}>{node.name}</Link>
        <span>/</span>
        <span>Edit</span>
      </div>
      <p className="app-eyebrow">Edit Node</p>
      <h1>{node.name}</h1>

      <form className="entity-form">
        <label>
          Name
          <input type="text" defaultValue={formValue.name} />
        </label>
        <label>
          Slug
          <input type="text" defaultValue={formValue.slug} />
        </label>
        <label>
          Node type
          <select defaultValue={formValue.nodeType}>
            <option value="person">Person</option>
            <option value="team">Team</option>
            <option value="business">Business</option>
            <option value="place">Place</option>
            <option value="community">Community</option>
          </select>
        </label>
        <label>
          Primary role
          <select defaultValue={formValue.primaryRole}>
            <option value="expert">Expert</option>
            <option value="host">Host</option>
            <option value="community">Community</option>
            <option value="business">Business</option>
          </select>
        </label>
        <label>
          Summary
          <textarea defaultValue={formValue.summary} />
        </label>
        <label>
          Location
          <input type="text" defaultValue={formValue.locationText} />
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
            Archive node
          </button>
        </div>
      </form>
    </section>
  )
}
