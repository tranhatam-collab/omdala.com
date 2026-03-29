import type { Metadata } from 'next'
import { buildMetadata } from '@omdala/seo'

export const metadata: Metadata = buildMetadata({
  title:       'Vision',
  description:
    'The long-term OMDALA vision is a durable coordination layer for human value, trust, and action.',
  path: '/vision',
})

export default function VisionPage() {
  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">Long-Term Vision</p>
        <h1>Design narrow enough to launch, strong enough to matter for decades.</h1>
        <p className="lead">
          OMDALA should start with sharp operational usefulness, but the architecture must be able to
          grow into a durable layer for trust-backed human coordination across many domains.
        </p>
      </section>

      <section className="panel">
        <div className="stack-list">
          <article className="stack-item">
            <h3>10-year horizon</h3>
            <p>Become indispensable for experts, hosts, communities, and small business nodes.</p>
          </article>
          <article className="stack-item">
            <h3>25-year horizon</h3>
            <p>Operate as shared infrastructure for distributed networks, assets, and local economies.</p>
          </article>
          <article className="stack-item">
            <h3>100-year horizon</h3>
            <p>Remain valuable because trust, coordination, proof, and resource activation are durable needs.</p>
          </article>
        </div>
      </section>
    </main>
  )
}
