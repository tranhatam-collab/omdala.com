import type { Metadata } from 'next'

export const DOCS_ORIGIN = 'https://docs.omdala.com'

// ADR-003: EN + VI. Docs select language with ?lang= (static export, ADR-011), so
// the VI alternate is the query URL of the same page, not a /vi path.
export const DOCS_ROUTES = [
  { path: '/', priority: 1 },
  { path: '/platform/', priority: 0.8 },
  { path: '/api/', priority: 0.8 },
  { path: '/trust/', priority: 0.7 },
] as const

export function docsLanguageAlternates(path: string) {
  return {
    en: `${DOCS_ORIGIN}${path}`,
    vi: `${DOCS_ORIGIN}${path}?lang=vi`,
    'x-default': `${DOCS_ORIGIN}${path}`,
  }
}

export function docsPageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: docsLanguageAlternates(path),
    },
  }
}
