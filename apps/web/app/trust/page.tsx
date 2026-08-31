import type { Metadata } from 'next'
import { TrustPageView } from './TrustPageView'
import { buildLocalizedMetadata } from '../lib/localized-metadata'

export const metadata: Metadata = buildLocalizedMetadata('trust', 'en')

export default function TrustPage() {
  return <TrustPageView locale="en" />
}
