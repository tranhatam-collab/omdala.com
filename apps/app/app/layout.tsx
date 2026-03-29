import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'OMDALA App',
    template: '%s — OMDALA App',
  },
  description: 'Authenticated product surface for nodes, trust, and coordinated action.',
  robots: { index: false, follow: false },
}

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
