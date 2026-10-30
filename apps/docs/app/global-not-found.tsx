import type { Metadata } from 'next'
import '../../../packages/ui/src/fonts.css'
import './globals.css'

export const metadata: Metadata = {
  title: '404 — Page not found | OMDALA Docs',
  robots: { index: false, follow: false },
}

// Self-contained 404 (the docs locales each have their own root layout).
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>404 — Page not found</h1>
          <p>The page you are looking for does not exist.</p>
          <p>
            <a href="/">OMDALA Docs</a>
          </p>
        </main>
      </body>
    </html>
  )
}
