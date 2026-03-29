import type { Metadata } from 'next'
import { buildMetadata } from '@omdala/seo'

export const metadata: Metadata = buildMetadata({
  title:       'For Hosts',
  description:
    'OMDALA helps hosts activate space, availability, trust, and local operating capacity with more structure.',
  path: '/for-hosts',
})

export default function ForHostsPage() {
  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">For Hosts</p>
        <h1>Turn place capacity into higher-quality utilization.</h1>
        <p className="lead">
          Hosts need more than listings. They need fit, timing, trust, and operational follow-through.
          OMDALA is designed to structure that full loop.
        </p>
      </section>

      <section className="panel">
        <ul className="feature-list">
          <li>Model spaces, availability, and place rules as structured resources.</li>
          <li>Match against trust level, purpose, timing, and expected operational fit.</li>
          <li>Use proofs and historical outcomes to strengthen future bookings.</li>
          <li>Move from inquiry to action with messaging, tasks, and booking states.</li>
        </ul>
      </section>
    </main>
  )
}
