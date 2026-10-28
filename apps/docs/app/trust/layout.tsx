import type { Metadata } from 'next'
import { docsPageMetadata } from '../lib/docs-seo'

export const metadata: Metadata = docsPageMetadata('/trust/', 'Trust system', 'How OMDALA models trust, verification and proof.')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
