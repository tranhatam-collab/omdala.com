import type { Metadata } from 'next'
import { VisionPageView } from './VisionPageView'
import { buildLocalizedMetadata } from '../lib/localized-metadata'

export const metadata: Metadata = buildLocalizedMetadata('vision', 'en')

export default function VisionPage() {
  return <VisionPageView locale="en" />
}
