import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@omdala/ui',
    '@omdala/types',
    '@omdala/core',
    '@omdala/auth-service',
    '@omdala/trust-service',
    '@omdala/matching-service',
  ],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Noindex — app is authenticated, not for search engines
          { key: 'X-Robots-Tag',              value: 'noindex, nofollow' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default config
