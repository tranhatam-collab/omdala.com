import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'OMDALA Docs',
  description: 'Official documentation for OMDALA — platform guides, API reference, and system architecture.',
  alternates:  { canonical: 'https://docs.omdala.com/' },
}

export default function DocsHomePage() {
  return (
    <main>
      <h1>OMDALA Documentation</h1>
      <p>Platform guides, API reference, and system architecture.</p>
      <nav>
        <Link href="/platform">Platform overview</Link>
        <Link href="/api">API reference</Link>
        <Link href="/trust">Trust system</Link>
      </nav>
    </main>
  )
}
