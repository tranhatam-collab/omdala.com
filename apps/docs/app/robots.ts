import type { MetadataRoute } from 'next'
import { isIndexableBuild } from '@omdala/seo'

const BASE_URL = 'https://docs.omdala.com'
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = isIndexableBuild({
    ...(process.env.OMDALA_NOINDEX ? { noindexFlag: process.env.OMDALA_NOINDEX } : {}),
    ...(process.env.CLOUDFLARE_PAGES_BRANCH ? { branch: process.env.CLOUDFLARE_PAGES_BRANCH } : {}),
  })

  return {
    rules: allowIndexing
      ? {
          userAgent: '*',
          allow: '/',
        }
      : {
          userAgent: '*',
          disallow: '/',
        },
    host: BASE_URL,
  }
}
