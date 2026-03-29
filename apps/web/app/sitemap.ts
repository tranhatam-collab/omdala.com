import type { MetadataRoute } from 'next'

const BASE_URL = 'https://omdala.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:          `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority:     1.0,
    },
    {
      url:          `${BASE_URL}/what-is-omdala`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:     0.9,
    },
    {
      url:          `${BASE_URL}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:     0.9,
    },
    {
      url:          `${BASE_URL}/for-experts`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:     0.8,
    },
    {
      url:          `${BASE_URL}/for-hosts`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:     0.8,
    },
    {
      url:          `${BASE_URL}/for-communities`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:     0.8,
    },
    {
      url:          `${BASE_URL}/trust`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:     0.7,
    },
    {
      url:          `${BASE_URL}/vision`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:     0.6,
    },
    {
      url:          `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority:     0.6,
    },
    {
      url:          `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority:     0.5,
    },
  ]
}
