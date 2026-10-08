import type { Metadata } from 'next'
import { HowItWorksPageView } from './HowItWorksPageView'
import { buildLocalizedMetadata } from '../lib/localized-metadata'

export const metadata: Metadata = buildLocalizedMetadata('howItWorks', 'en')

export default function HowItWorksPage() {
  return <HowItWorksPageView locale="en" />
}
