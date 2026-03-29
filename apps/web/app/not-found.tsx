import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title:  'Page Not Found — OMDALA',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <nav aria-label="Helpful links">
        <Link href="/">Return to OMDALA</Link>
        <Link href="/what-is-omdala">What is OMDALA</Link>
        <Link href="/how-it-works">How it works</Link>
      </nav>
    </main>
  )
}
