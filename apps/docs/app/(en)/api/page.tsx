import { API_COPY } from '../../lib/docs-content'
import { docsPageMetadata } from '../../lib/docs-seo'
import { ApiView } from '../../lib/docs-views'

export const metadata = docsPageMetadata(
  '/api',
  'en',
  API_COPY.title.en,
  API_COPY.bodyAfter.en,
)

export default function Page() {
  return <ApiView language="en" />
}
