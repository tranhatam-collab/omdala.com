import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,

  // Transpile shared workspace packages
  transpilePackages: ['@omdala/ui', '@omdala/seo', '@omdala/types'],

  // Security and performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // Canonical redirects
  async redirects() {
    return [
      {
        source:      '/:path*',
        has:         [{ type: 'host', value: 'www.omdala.com' }],
        destination: 'https://omdala.com/:path*',
        permanent:   true,
      },
    ]
  },
}

export default config
