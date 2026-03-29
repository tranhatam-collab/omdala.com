import type { Metadata } from 'next'
import { buildMetadata } from '@omdala/seo'

export const metadata: Metadata = buildMetadata({
  title:       'Contact',
  description:
    'Current official OMDALA surfaces for product, documentation, and API access before public launch expansion.',
  path: '/contact',
})

export default function ContactPage() {
  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">Contact Surface</p>
        <h1>Use the official product and documentation endpoints.</h1>
        <p className="lead">
          This branch locks the platform surfaces first. Operational inboxes and public contact forms
          should be finalized before launch, but the system entry points are already defined.
        </p>
      </section>

      <section className="panel">
        <div className="card-grid">
          <article>
            <h3>Product app</h3>
            <p><span className="inline-code">https://app.omdala.com</span></p>
          </article>
          <article>
            <h3>Documentation</h3>
            <p><span className="inline-code">https://docs.omdala.com</span></p>
          </article>
          <article>
            <h3>API base</h3>
            <p><span className="inline-code">https://api.omdala.com</span></p>
          </article>
        </div>
      </section>
    </main>
  )
}
