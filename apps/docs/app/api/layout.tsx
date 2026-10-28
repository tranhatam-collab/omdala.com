import type { Metadata } from 'next'
import { docsPageMetadata } from '../lib/docs-seo'

export const metadata: Metadata = docsPageMetadata('/api/', 'API reference', 'Reference for the OMDALA public API.')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
