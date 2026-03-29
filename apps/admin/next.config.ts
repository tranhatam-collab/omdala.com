import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@omdala/ui', '@omdala/types', '@omdala/core', '@omdala/auth-service'],
}

export default config
