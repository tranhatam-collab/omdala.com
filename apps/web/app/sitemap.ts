import type { MetadataRoute } from 'next'

const BASE_URL = 'https://omdala.com'
const BUILD_DATE = new Date('2026-03-29T00:00:00.000Z')

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:          `${BASE_URL}/`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly',
      priority:     1.0,
    },
    {
      url:          `${BASE_URL}/what-is-omdala`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority:     0.9,
    },
    {
      url:          `${BASE_URL}/how-it-works`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority:     0.9,
    },
    {
      url:          `${BASE_URL}/for-experts`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority:     0.8,
    },
    {
      url:          `${BASE_URL}/for-hosts`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority:     0.8,
    },
    {
      url:          `${BASE_URL}/for-communities`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority:     0.8,
    },
    {
      url:          `${BASE_URL}/trust`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority:     0.7,
    },
    {
      url:          `${BASE_URL}/vision`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority:     0.6,
    },
    {
      url:          `${BASE_URL}/faq`,
      lastModified: BUILD_DATE,
      changeFrequency: 'monthly',
      priority:     0.6,
    },
    {
      url:          `${BASE_URL}/contact`,
      lastModified: BUILD_DATE,
      changeFrequency: 'yearly',
      priority:     0.5,
    },
  ]
}
