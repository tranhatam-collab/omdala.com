import path from 'path'
import { fileURLToPath } from 'url'
import type { NextConfig } from 'next'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(__dirname, '..', '..')

const config: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: monorepoRoot,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    // The EN and VI trees each have their own root layout, so unknown URLs need a self-contained 404.
    globalNotFound: true,
  },
  transpilePackages: ['@omdala/ui', '@omdala/seo', '@omdala/types', '@omdala/core'],
}

export default config
