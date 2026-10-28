import type { MetadataRoute } from 'next'
import { DOCS_ORIGIN, DOCS_ROUTES, docsLanguageAlternates } from './lib/docs-seo'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return DOCS_ROUTES.map(({ path, priority }) => ({
    url: `${DOCS_ORIGIN}${path}`,
    lastModified,
    changeFrequency: 'monthly',
    priority,
    alternates: {
      languages: docsLanguageAlternates(path),
    },
  }))
}
