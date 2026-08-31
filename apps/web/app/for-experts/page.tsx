import type { Metadata } from 'next'
import { ForExpertsPageView } from './ForExpertsPageView'
import { buildLocalizedMetadata } from '../lib/localized-metadata'

export const metadata: Metadata = buildLocalizedMetadata('forExperts', 'en')

export default function ForExpertsPage() {
  return <ForExpertsPageView locale="en" />
}
