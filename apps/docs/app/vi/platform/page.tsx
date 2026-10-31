import { PLATFORM_COPY } from '../../lib/docs-content'
import { docsPageMetadata } from '../../lib/docs-seo'
import { PlatformView } from '../../lib/docs-views'

export const metadata = docsPageMetadata(
  '/platform',
  'vi',
  PLATFORM_COPY.title.vi,
  PLATFORM_COPY.body.vi,
)

export default function Page() {
  return <PlatformView language="vi" />
}
