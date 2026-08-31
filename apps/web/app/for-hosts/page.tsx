import type { Metadata } from 'next'
import { ForHostsPageView } from './ForHostsPageView'
import { buildLocalizedMetadata } from '../lib/localized-metadata'

export const metadata: Metadata = buildLocalizedMetadata('forHosts', 'en')

export default function ForHostsPage() {
  return <ForHostsPageView locale="en" />
}
