import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(__dirname, '..', '..')

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export',
  turbopack: {
    root: monorepoRoot,
  },
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
