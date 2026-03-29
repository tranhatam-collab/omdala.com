import type { Metadata } from 'next'
import { buildMetadata } from '@omdala/seo'

export const metadata: Metadata = buildMetadata({
  title:       'For Communities',
  description:
    'OMDALA helps communities coordinate members, assets, trust, and shared actions without chat chaos.',
  path: '/for-communities',
})

export default function ForCommunitiesPage() {
  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">For Communities</p>
        <h1>Run groups, assets, and governance with more clarity.</h1>
        <p className="lead">
          Communities become stronger when shared resources, roles, proof, and coordination live in
          one calm system instead of fragmented threads and manual workarounds.
        </p>
      </section>

      <section className="panel">
        <div className="card-grid">
          <article>
            <h3>Shared resources</h3>
            <p>Track assets, availability, events, and responsibilities across the group.</p>
          </article>
          <article>
            <h3>Member trust</h3>
            <p>Build visible reliability through proof, participation, role history, and governance logs.</p>
          </article>
          <article>
            <h3>Operational memory</h3>
            <p>Keep community actions auditable so valuable knowledge does not disappear into chat.</p>
          </article>
        </div>
      </section>
    </main>
  )
}
