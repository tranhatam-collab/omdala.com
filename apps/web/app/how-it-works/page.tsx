import type { Metadata } from 'next'
import { buildMetadata } from '@omdala/seo'

export const metadata: Metadata = buildMetadata({
  title:       'How It Works',
  description:
    'Understand the core OMDALA loop: visibility, structuring, matching, action, proof, and compounding trust.',
  path: '/how-it-works',
})

export default function HowItWorksPage() {
  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">System Logic</p>
        <h1>OMDALA works by turning hidden capacity into structured action.</h1>
        <p className="lead">
          The platform is built around one compounding loop: see what exists, match the right fit,
          move to action, store proof, and improve future outcomes.
        </p>
      </section>

      <section className="panel">
        <div className="stack-list">
          <article className="stack-item">
            <h3>1. Map the node</h3>
            <p>Capture identity, goals, roles, availability, assets, and current trust state.</p>
          </article>
          <article className="stack-item">
            <h3>2. Normalize the resource</h3>
            <p>Turn loose information into resource objects, offers, requests, and operational states.</p>
          </article>
          <article className="stack-item">
            <h3>3. Score the fit</h3>
            <p>Use matching signals such as trust, timing, relevance, locality, capacity, and intent.</p>
          </article>
          <article className="stack-item">
            <h3>4. Convert to execution</h3>
            <p>Draft messages, create tasks, open bookings, and guide follow-through with AI assistance.</p>
          </article>
          <article className="stack-item">
            <h3>5. Record proof</h3>
            <p>Attach receipts, confirmations, outputs, endorsements, and verification artifacts.</p>
          </article>
          <article className="stack-item">
            <h3>6. Compound trust</h3>
            <p>Use outcomes to increase discoverability, reduce risk, and improve future opportunity quality.</p>
          </article>
        </div>
      </section>
    </main>
  )
}
