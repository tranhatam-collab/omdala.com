import { SEO_DEFAULTS } from './constants'

const BASE_URL = SEO_DEFAULTS.baseUrl

export function getOrganizationSchema() {
  return {
    '@context':  'https://schema.org',
    '@type':     'Organization',
    name:        'OMDALA',
    url:          BASE_URL,
    logo:        `${BASE_URL}/logo.png`,
    description: SEO_DEFAULTS.description,
    sameAs:      [] as string[],
  }
}

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type':    'WebSite',
    name:       'OMDALA',
    url:         BASE_URL,
  }
}

export function getBreadcrumbSchema(
  items: ReadonlyArray<{ readonly name: string; readonly url: string }>
) {
  return {
    '@context':       'https://schema.org',
    '@type':          'BreadcrumbList',
    itemListElement:   items.map((item, index) => ({
      '@type':   'ListItem',
      position:   index + 1,
      name:       item.name,
      item:       item.url,
    })),
  }
}

export function getTechArticleSchema(article: {
  title:       string
  description: string
  url:         string
  datePublished?: string
  dateModified?:  string
}) {
  return {
    '@context':    'https://schema.org',
    '@type':       'TechArticle',
    headline:       article.title,
    description:    article.description,
    url:            article.url,
    publisher: {
      '@type': 'Organization',
      name:    'OMDALA',
      url:      BASE_URL,
    },
    ...(article.datePublished ? { datePublished: article.datePublished } : {}),
    ...(article.dateModified  ? { dateModified:  article.dateModified  } : {}),
  }
}
