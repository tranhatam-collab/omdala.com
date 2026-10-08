import type { Metadata } from 'next'
import { HomePageView } from './HomePageView'
import { buildLocalizedMetadata } from './lib/localized-metadata'

export const metadata: Metadata = buildLocalizedMetadata('home', 'en')

export default function HomePage() {
  return <HomePageView locale="en" />
}
