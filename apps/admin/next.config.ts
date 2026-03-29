import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@omdala/ui', '@omdala/types'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Admin — never index, never frame
          { key: 'X-Robots-Tag',              value: 'noindex, nofollow' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'no-referrer' },
        ],
      },
    ]
  },
}

export default config
