import type { Metadata } from 'next'
import { withLanguagePath, type OmdalaLanguage } from '@omdala/core'

export const DOCS_ORIGIN = 'https://docs.omdala.com'

// ADR-003: EN + VI. EN is the default at /, VI lives under /vi (static export, ADR-002).
export const DOCS_LANGUAGES = ['en', 'vi'] as const satisfies readonly OmdalaLanguage[]
export type DocsLanguage = (typeof DOCS_LANGUAGES)[number]

export const DOCS_ROUTES = [
  { path: '/', priority: 1 },
  { path: '/platform/', priority: 0.8 },
  { path: '/api/', priority: 0.8 },
  { path: '/trust/', priority: 0.7 },
] as const

export function docsPath(path: string, language: OmdalaLanguage): string {
  const localized = withLanguagePath(path, language)
  return localized.endsWith('/') ? localized : `${localized}/`
}

export function docsUrl(path: string, language: OmdalaLanguage): string {
  return `${DOCS_ORIGIN}${docsPath(path, language)}`
}

export function docsLanguageAlternates(path: string) {
  return {
    en: docsUrl(path, 'en'),
    vi: docsUrl(path, 'vi'),
    'x-default': docsUrl(path, 'en'),
  }
}

export function docsPageMetadata(
  path: string,
  language: DocsLanguage,
  title: string,
  description: string,
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: docsUrl(path, language),
      languages: docsLanguageAlternates(path),
    },
  }
}
