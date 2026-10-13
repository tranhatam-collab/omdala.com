import Link from 'next/link'
import { listModerationCases } from '@omdala/core'

export default function AdminPage() {
  const cases = listModerationCases()
  const openCases = cases.filter((item) => item.status === 'open')
  const highSeverity = openCases.filter((item) => item.severity === 'high')

  return (
    <>
      <section className="admin-card">
        <p className="admin-eyebrow">Moderation Overview</p>
        <h1>Operations queue</h1>
        <p className="admin-copy">
          This admin shell converts the former placeholder into a usable moderation surface for nodes,
          offers, requests, proofs, and verification review.
        </p>
      </section>

      <section className="admin-grid">
        <article className="admin-stat">
          <strong>Open cases</strong>
          <p>{openCases.length}</p>
        </article>
        <article className="admin-stat">
          <strong>High severity</strong>
          <p>{highSeverity.length}</p>
        </article>
        <article className="admin-stat">
          <strong>Next review area</strong>
          <p>Offers that require proof or stronger trust before publication.</p>
        </article>
      </section>

      <section className="admin-card">
        <h2>Current queue</h2>
        <div className="admin-list">
          {openCases.map((item) => (
            <article key={item.id} className="admin-list-item">
              <p className="admin-eyebrow">{item.subjectType}</p>
              <h3>{item.title}</h3>
              <p className="admin-copy">{item.summary}</p>
              <div className="admin-meta">
                <span>Severity: {item.severity}</span>
                <span>Action: {item.actionHint}</span>
              </div>
            </article>
          ))}
        </div>
        <div className="admin-links">
          <Link href="/offers">Review offers</Link>
          <Link href="/requests">Review requests</Link>
          <Link href="/proofs">Review proofs</Link>
        </div>
      </section>
    </>
  )
}
