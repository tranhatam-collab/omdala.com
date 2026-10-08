import Link from 'next/link'
import { APP_ROUTES } from '@omdala/core'
import { getTrustWorkspace } from '@/lib/runtime-data'

export default function TrustPage() {
  const trustWorkspace = getTrustWorkspace()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Trust Runtime</p>
        <h1>Trust workspace</h1>
        <p className="app-copy">
          This screen aggregates node trust, resource trust, and proof queue priorities so moderation
          and activation can run from one operational surface.
        </p>
      </section>

      <section className="detail-layout">
        <article className="detail-card">
          <h2>Node trust board</h2>
          <ul className="dashboard-list">
            {trustWorkspace.nodeTrust.map(({ node, summary }) => (
              <li key={node.id}>
                <strong>{node.name}</strong> — {summary.level} ({summary.overallScore}) / proofs:{' '}
                {summary.proofCount}
              </li>
            ))}
          </ul>
        </article>

        <article className="detail-card">
          <h2>Resource trust board</h2>
          <ul className="dashboard-list">
            {trustWorkspace.resourceTrust.map(({ resource, summary }) => (
              <li key={resource.id}>
                <strong>{resource.title}</strong> — {summary.level} ({summary.overallScore}) / proofs:{' '}
                {summary.proofCount}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="dashboard-panel">
        <h2>Proof moderation queue</h2>
        <div className="entity-grid">
          {trustWorkspace.proofs.map(({ proof, priority }) => (
            <article key={proof.id} className="entity-card">
              <p className="app-eyebrow">{proof.subjectType}</p>
              <h3>{proof.proofType}</h3>
              <p className="app-copy">{proof.summary}</p>
              <div className="pill-row">
                <span className="app-pill">status:{proof.verificationStatus}</span>
                <span className="app-pill">priority:{priority}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Next actions</h2>
        <div className="entity-actions">
          <Link href={APP_ROUTES.resources} className="app-button app-button--primary">
            Enrich resource proofs
          </Link>
          <Link href={APP_ROUTES.nodes} className="app-button app-button--ghost">
            Review node readiness
          </Link>
          <Link href={APP_ROUTES.dashboard} className="app-button app-button--ghost">
            Back to dashboard
          </Link>
        </div>
      </section>
    </>
  )
}
