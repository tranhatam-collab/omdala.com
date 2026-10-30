import { DocumentLanguageSync } from '@omdala/ui'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { DOCS_ORIGIN, type DocsLanguage } from './docs-seo'
import '../globals.css'

export const DOCS_ROOT_METADATA: Metadata = {
  metadataBase: new URL(DOCS_ORIGIN),
  title: {
    default: 'OMDALA Docs',
    template: '%s | OMDALA Docs',
  },
  description:
    'Official documentation for OMDALA — platform guides, API reference, and system architecture.',
}

export function DocsRootLayout({ language, children }: { language: DocsLanguage; children: ReactNode }) {
  return (
    <html lang={language}>
      <body>
        <DocumentLanguageSync language={language} />
        <div className="docs-topbar">
          <LanguageSwitcher />
        </div>
        {children}
      </body>
    </html>
  )
}
