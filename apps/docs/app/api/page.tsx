import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'API Reference',
  description: 'High-level API reference and route families for OMDALA.',
  alternates:  { canonical: 'https://docs.omdala.com/api' },
}

export default function ApiDocsPage() {
  return (
    <main>
      <h1>OMDALA API Reference</h1>
      <p>
        The master API is versioned under <code>/v1</code> and groups routes by identity, resources,
        offers, requests, matches, conversations, bookings, payments, proofs, trust, and admin actions.
      </p>
    </main>
  )
}
