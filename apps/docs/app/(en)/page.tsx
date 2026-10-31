import { HOME_COPY } from '../lib/docs-content'
import { docsPageMetadata } from '../lib/docs-seo'
import { HomeView } from '../lib/docs-views'

export const metadata = docsPageMetadata(
  '/',
  'en',
  HOME_COPY.title.en,
  HOME_COPY.lead.en,
)

export default function Page() {
  return <HomeView language="en" />
}
