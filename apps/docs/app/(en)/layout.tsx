import type { Metadata } from 'next'
import { DOCS_ROOT_METADATA, DocsRootLayout } from '../lib/docs-shell'

export const metadata: Metadata = DOCS_ROOT_METADATA

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocsRootLayout language="en">{children}</DocsRootLayout>
}
