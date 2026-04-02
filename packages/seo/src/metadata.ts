import type { Metadata } from 'next'
import { SEO_DEFAULTS } from './constants'
import { buildLanguageAlternates, buildSeoUrl } from './utils'

type SeoLocale = 'en' | 'vi'

export interface PageMetadataInput {
  title:        string
  description?: string
  path:         string
  ogImage?:     string
  noindex?:     boolean
  locale?:      `${SeoLocale}_${Uppercase<SeoLocale>}` | string
  alternateLanguages?: Record<string, string>
}

export function buildMetadata(input: PageMetadataInput): Metadata {
  const {
    title,
    description = SEO_DEFAULTS.description,
    path,
    ogImage      = SEO_DEFAULTS.ogImage,
    noindex      = false,
    locale       = SEO_DEFAULTS.locale,
    alternateLanguages,
  } = input

  const url        = buildSeoUrl(path)
  const fullTitle  = `${title} — ${SEO_DEFAULTS.siteName}`
  const alternates = alternateLanguages ?? buildLanguageAlternates(path)

  return {
    title,
    description,
    metadataBase: new URL(SEO_DEFAULTS.baseUrl),

    alternates: {
      canonical:  url,
      languages: alternates,
    },

    robots: noindex
      ? { index: false, follow: false }
      : { index: true,  follow: true  },

    openGraph: {
      title:    fullTitle,
      description,
      url,
      siteName: SEO_DEFAULTS.siteName,
      type:     'website',
      locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },

    twitter: {
      card:        'summary_large_image',
      title:       fullTitle,
      description,
      images:      [ogImage],
    },
  }
}
