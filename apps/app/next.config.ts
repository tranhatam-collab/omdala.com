import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    '@omdala/ui',
    '@omdala/types',
    '@omdala/core',
    '@omdala/ai-service',
    '@omdala/auth-service',
    '@omdala/notifications-service',
    '@omdala/trust-service',
    '@omdala/matching-service',
  ],
}

export default config
