import type { MetadataRoute } from 'next'

const BASE_URL = 'https://omdala.com'
export const dynamic = 'force-static'

function isIndexableBuild() {
  if (process.env.OMDALA_NOINDEX === 'true') {
    return false
  }

  const branch = process.env.CLOUDFLARE_PAGES_BRANCH
  if (!branch) {
    return true
  }

  return branch === 'main' || branch === 'production'
}

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = isIndexableBuild()

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
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
