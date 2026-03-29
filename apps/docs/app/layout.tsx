import type { Metadata } from 'next'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.omdala.com'),
  title: {
    default:  'OMDALA Docs',
    template: '%s | OMDALA Docs',
  },
  description: 'Official documentation for OMDALA — platform guides, API reference, and system architecture.',
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="docs-topbar">
          <LanguageSwitcher />
        </div>
        {children}
      </body>
    </html>
  )
}
