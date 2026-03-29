import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'Trust System',
  description: 'Trust, verification, proof, moderation, and explainable scoring in OMDALA.',
  alternates:  { canonical: 'https://docs.omdala.com/trust' },
}

export default function TrustDocsPage() {
  return (
    <main>
      <h1>OMDALA Trust System</h1>
      <p>
        Trust in OMDALA is derived from verification, proof, completion, behavior, economic history,
        and governance signals. It is designed to be explainable, auditable, and action-relevant.
      </p>
    </main>
  )
}
