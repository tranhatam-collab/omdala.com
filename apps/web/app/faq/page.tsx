import type { Metadata } from 'next'
import { buildMetadata } from '@omdala/seo'

const faqs = [
  {
    question: 'Is OMDALA a marketplace?',
    answer:
      'Not primarily. Marketplace behavior can exist inside the system, but OMDALA is broader: it handles identity, trust, matching, action, and proof.',
  },
  {
    question: 'Is OMDALA only for AI workflows?',
    answer:
      'No. AI is a support layer for planning and orchestration. The product is ultimately about real operational outcomes.',
  },
  {
    question: 'Who should use it first?',
    answer:
      'Operators with real capacity to activate: experts, hosts, communities, and small business nodes.',
  },
  {
    question: 'Why is trust central?',
    answer:
      'Because weak trust destroys matching quality, discoverability, and repeat outcomes faster than feature gaps do.',
  },
]

export const metadata: Metadata = buildMetadata({
  title:       'FAQ',
  description:
    'Common questions about what OMDALA is, who it serves, and why trust and coordination are core.',
  path: '/faq',
})

export default function FaqPage() {
  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">FAQ</p>
        <h1>Clear answers before the build expands.</h1>
        <p className="lead">
          The fastest way to keep the platform aligned is to answer the category and system questions
          early and consistently.
        </p>
      </section>

      <section className="panel">
        <div className="faq-grid">
          {faqs.map((faq) => (
            <article key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
