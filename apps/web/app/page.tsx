import type { Metadata } from 'next'
import { buildMetadata } from '@omdala/seo'

export const metadata: Metadata = buildMetadata({
  title:       'The Operating Layer for Real-World Value',
  description:
    'OMDALA is the global operating layer for real-world value, trust, and intelligent coordination.',
  path: '/',
})

export default function HomePage() {
  return (
    <main>
      <section>
        <h1>OMDALA</h1>
        <p>The operating layer for real-world value.</p>
      </section>
    </main>
  )
}
