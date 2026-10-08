import { listMockNodes } from '@omdala/core'
import type { OmdalaLanguage } from '@omdala/core'
import { ADMIN_COPY, t } from '../lib/admin-copy'

export const dynamic = 'force-static'

export default async function AdminNodesPage() {
  const language: OmdalaLanguage = 'en'
  const nodes = listMockNodes()

  return (
    <section className="admin-card">
      <p className="admin-eyebrow">{t(language, ADMIN_COPY.nodes.eyebrow)}</p>
      <h1>{t(language, ADMIN_COPY.nodes.title)}</h1>
      <div className="admin-list">
        {nodes.map((node) => (
          <article key={node.id} className="admin-list-item">
            <h3>{node.name}</h3>
            <p className="admin-copy">{node.summary}</p>
            <div className="admin-meta">
              <span>{t(language, ADMIN_COPY.nodes.role)}: {node.primaryRole}</span>
              <span>{t(language, ADMIN_COPY.nodes.verification)}: {node.verificationStatus}</span>
              <span>{t(language, ADMIN_COPY.nodes.trust)}: {node.trustLevel}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
