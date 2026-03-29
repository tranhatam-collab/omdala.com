import type { Metadata } from 'next'
import { buildMetadata } from '@omdala/seo'

export const metadata: Metadata = buildMetadata({
  title:       'Trust Architecture',
  description:
    'Trust in OMDALA is built from verification, proof, behavior, governance, and explainable system rules.',
  path: '/trust',
})

export default function TrustPage() {
  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">Trust by Design</p>
        <h1>Trust is infrastructure, not decoration.</h1>
        <p className="lead">
          OMDALA does not reduce trust to stars and vibes. It treats trust as a system built from
          evidence, behavior, completion, governance, and explainable visibility rules.
        </p>
      </section>

      <section className="panel">
        <div className="card-grid">
          <article>
            <h3>Verification</h3>
            <p>Identity, ownership, payment, affiliation, and other factual checks where appropriate.</p>
          </article>
          <article>
            <h3>Proof</h3>
            <p>Receipts, confirmations, outputs, attendance, delivery, and completion evidence.</p>
          </article>
          <article>
            <h3>Behavior</h3>
            <p>Response quality, reliability, cancellation patterns, dispute history, and follow-through.</p>
          </article>
          <article>
            <h3>Governance</h3>
            <p>Warnings, overrides, moderation actions, and audit trails for sensitive decisions.</p>
          </article>
        </div>
      </section>
    </main>
  )
}
