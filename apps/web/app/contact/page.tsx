import type { Metadata } from 'next'
import { ContactPageView } from './ContactPageView'
import { buildLocalizedMetadata } from '../lib/localized-metadata'

export const metadata: Metadata = buildLocalizedMetadata('contact', 'en')

export default function ContactPage() {
  return <ContactPageView locale="en" />
}
