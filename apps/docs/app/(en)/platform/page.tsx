import { PLATFORM_COPY } from '../../lib/docs-content'
import { docsPageMetadata } from '../../lib/docs-seo'
import { PlatformView } from '../../lib/docs-views'

export const metadata = docsPageMetadata(
  '/platform',
  'en',
  PLATFORM_COPY.title.en,
  PLATFORM_COPY.body.en,
)

export default function Page() {
  return <PlatformView language="en" />
}
