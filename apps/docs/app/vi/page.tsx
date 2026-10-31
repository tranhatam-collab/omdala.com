import { HOME_COPY } from '../lib/docs-content'
import { docsPageMetadata } from '../lib/docs-seo'
import { HomeView } from '../lib/docs-views'

export const metadata = docsPageMetadata(
  '/',
  'vi',
  HOME_COPY.title.vi,
  HOME_COPY.lead.vi,
)

export default function Page() {
  return <HomeView language="vi" />
}
