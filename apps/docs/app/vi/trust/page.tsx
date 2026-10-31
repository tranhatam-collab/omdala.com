import { TRUST_COPY } from '../../lib/docs-content'
import { docsPageMetadata } from '../../lib/docs-seo'
import { TrustView } from '../../lib/docs-views'

export const metadata = docsPageMetadata(
  '/trust',
  'vi',
  TRUST_COPY.title.vi,
  TRUST_COPY.body.vi,
)

export default function Page() {
  return <TrustView language="vi" />
}
