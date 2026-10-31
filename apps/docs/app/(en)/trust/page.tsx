import { TRUST_COPY } from '../../lib/docs-content'
import { docsPageMetadata } from '../../lib/docs-seo'
import { TrustView } from '../../lib/docs-views'

export const metadata = docsPageMetadata(
  '/trust',
  'en',
  TRUST_COPY.title.en,
  TRUST_COPY.body.en,
)

export default function Page() {
  return <TrustView language="en" />
}
