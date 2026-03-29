import type { MetadataRoute } from 'next'
import { OMDALA_PAGES } from '@omdala/seo'

const BASE_URL = 'https://omdala.com'
const BUILD_DATE = new Date()

const ROUTE_PRIORITY: Record<string, number> = {
  [OMDALA_PAGES.home]: 1,
  [OMDALA_PAGES.whatIsOmdala]: 0.9,
  [OMDALA_PAGES.howItWorks]: 0.9,
  [OMDALA_PAGES.forExperts]: 0.8,
  [OMDALA_PAGES.forHosts]: 0.8,
  [OMDALA_PAGES.forCommunities]: 0.8,
  [OMDALA_PAGES.trust]: 0.7,
  [OMDALA_PAGES.vision]: 0.6,
  [OMDALA_PAGES.faq]: 0.6,
  [OMDALA_PAGES.contact]: 0.5,
}

const ROUTE_CHANGE_FREQUENCY: Record<string, MetadataRoute.Sitemap[number]['changeFrequency']> = {
  [OMDALA_PAGES.home]: 'weekly',
  [OMDALA_PAGES.whatIsOmdala]: 'monthly',
  [OMDALA_PAGES.howItWorks]: 'monthly',
  [OMDALA_PAGES.forExperts]: 'monthly',
  [OMDALA_PAGES.forHosts]: 'monthly',
  [OMDALA_PAGES.forCommunities]: 'monthly',
  [OMDALA_PAGES.trust]: 'monthly',
  [OMDALA_PAGES.vision]: 'monthly',
  [OMDALA_PAGES.faq]: 'monthly',
  [OMDALA_PAGES.contact]: 'yearly',
}

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = Object.values(OMDALA_PAGES)

  return routes.map((path) => {
    const url = `${BASE_URL}${path}`
    return {
      url,
      lastModified: BUILD_DATE,
      changeFrequency: ROUTE_CHANGE_FREQUENCY[path] ?? 'monthly',
      priority: ROUTE_PRIORITY[path] ?? 0.5,
      alternates: {
        languages: {
          en: url,
          vi: `${url}?lang=vi`,
        },
      },
    }
  })
}
