import { API_COPY } from '../../lib/docs-content'
import { docsPageMetadata } from '../../lib/docs-seo'
import { ApiView } from '../../lib/docs-views'

export const metadata = docsPageMetadata(
  '/api',
  'vi',
  API_COPY.title.vi,
  API_COPY.bodyAfter.vi,
)

export default function Page() {
  return <ApiView language="vi" />
}
