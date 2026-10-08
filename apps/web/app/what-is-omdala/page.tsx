import type { Metadata } from 'next'
import { WhatIsOmdalaPageView } from './WhatIsOmdalaPageView'
import { buildLocalizedMetadata } from '../lib/localized-metadata'

export const metadata: Metadata = buildLocalizedMetadata('whatIsOmdala', 'en')

export default function WhatIsOmdalaPage() {
  return <WhatIsOmdalaPageView locale="en" />
}
