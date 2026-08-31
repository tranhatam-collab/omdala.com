import type { Metadata } from 'next'
import { FaqPageView } from './FaqPageView'
import { buildLocalizedMetadata } from '../lib/localized-metadata'

export const metadata: Metadata = buildLocalizedMetadata('faq', 'en')

export default function FaqPage() {
  return <FaqPageView locale="en" />
}
