import type { Metadata, Viewport } from 'next'
import { LanguageSwitcher, OMDALA_VIEWPORT } from '@omdala/ui'
import '@omdala/ui/styles/tokens.css'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.omdala.com'),
  title: {
    default:  'OMDALA Docs',
    template: '%s | OMDALA Docs',
  },
  description: 'Official documentation for OMDALA — platform guides, API reference, and system architecture.',
}

export const viewport: Viewport = OMDALA_VIEWPORT

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="docs-topbar">
          <LanguageSwitcher classPrefix="docs-language-switcher" />
        </div>
        {children}
      </body>
    </html>
  )
}
