import type { Metadata } from 'next'
import { ForCommunitiesPageView } from './ForCommunitiesPageView'
import { buildLocalizedMetadata } from '../lib/localized-metadata'

export const metadata: Metadata = buildLocalizedMetadata('forCommunities', 'en')

export default function ForCommunitiesPage() {
  return <ForCommunitiesPageView locale="en" />
}
