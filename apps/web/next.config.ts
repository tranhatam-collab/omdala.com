import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },

  // Transpile shared workspace packages
  transpilePackages: ['@omdala/ui', '@omdala/seo', '@omdala/types'],
}

export default config
