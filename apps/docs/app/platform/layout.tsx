import type { Metadata } from 'next'
import { docsPageMetadata } from '../lib/docs-seo'

export const metadata: Metadata = docsPageMetadata('/platform/', 'Platform overview', 'OMDALA platform layer: identity, resources, matching, trust and execution across web, app, API, docs and admin.')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
