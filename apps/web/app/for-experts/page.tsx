import type { Metadata } from 'next'
import { buildMetadata } from '@omdala/seo'

export const metadata: Metadata = buildMetadata({
  title:       'For Experts',
  description:
    'OMDALA helps experts package skill, trust, availability, and relationships into structured opportunities.',
  path: '/for-experts',
})

export default function ForExpertsPage() {
  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">For Experts</p>
        <h1>Turn expertise into structured, trusted opportunity.</h1>
        <p className="lead">
          OMDALA helps specialists, advisors, creators, and operators package time, knowledge, and
          credibility into offers, requests, and repeatable trust-backed workflows.
        </p>
      </section>

      <section className="panel">
        <div className="card-grid">
          <article>
            <h3>Package your value</h3>
            <p>Convert expertise, availability, and goals into clear offers and operational objects.</p>
          </article>
          <article>
            <h3>Improve signal quality</h3>
            <p>Use proof, verification, and completion history to make discovery more trustworthy.</p>
          </article>
          <article>
            <h3>Act faster</h3>
            <p>Move from idea to outreach, booking, pricing, and task lists with AI support.</p>
          </article>
        </div>
      </section>
    </main>
  )
}
