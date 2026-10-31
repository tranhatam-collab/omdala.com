import type { MetadataRoute } from 'next'
import { DOCS_LANGUAGES, DOCS_ROUTES, docsLanguageAlternates, docsUrl } from './lib/docs-seo'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return DOCS_ROUTES.flatMap(({ path, priority }) =>
    DOCS_LANGUAGES.map((language) => ({
      url: docsUrl(path, language),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority,
      alternates: { languages: docsLanguageAlternates(path) },
    })),
  )
}
