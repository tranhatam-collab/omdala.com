import path from 'path'
import { fileURLToPath } from 'url'
import type { NextConfig } from 'next'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(__dirname, '..', '..')

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@omdala/ui', '@omdala/seo', '@omdala/types', '@omdala/core'],
}

export default config
