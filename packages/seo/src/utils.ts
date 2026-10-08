import { SEO_DEFAULTS } from './constants'

export type SeoLocale = 'en' | 'vi' | 'zh' | 'es' | 'ja' | 'ko'
export type SeoHreflang = SeoLocale | 'x-default'

export function normalizeSeoPath(path: string): string {
  if (!path) return '/'
  return path.startsWith('/') ? path : `/${path}`
}

export function buildSeoUrl(path: string): string {
  return `${SEO_DEFAULTS.baseUrl}${normalizeSeoPath(path)}`
}

export function buildLanguageAlternates(
  path: string,
  options: {
    defaultLocale?: SeoLocale
    locales?: readonly SeoLocale[]
  } = {},
): Record<SeoHreflang, string> {
  const defaultLocale = options.defaultLocale ?? 'en'
  const locales = options.locales ?? ['en', 'vi', 'zh', 'es', 'ja', 'ko']
  const normalizedPath = normalizeSeoPath(path)
  const segments = normalizedPath.split('/').filter(Boolean)
  const maybeLocale = segments[0] as SeoLocale | undefined
  const basePath =
    maybeLocale && locales.includes(maybeLocale)
      ? `/${segments.slice(1).join('/')}` || '/'
      : normalizedPath
  const safeBasePath = basePath === '//' ? '/' : basePath
  const alternates = {
    'x-default': buildSeoUrl(safeBasePath),
  } as Record<SeoHreflang, string>

  for (const locale of locales) {
    alternates[locale] =
      locale === defaultLocale
        ? buildSeoUrl(safeBasePath)
        : buildSeoUrl(safeBasePath === '/' ? `/${locale}` : `/${locale}${safeBasePath}`)
  }

  return alternates
}

export function isIndexableBuild(options?: {
  noindexFlag?: string
  branch?: string
  productionBranches?: readonly string[]
}): boolean {
  if (options?.noindexFlag === 'true') {
    return false
  }

  const branch = options?.branch
  if (!branch) {
    return true
  }

  const productionBranches = options?.productionBranches ?? ['main', 'production']
  return productionBranches.includes(branch)
}
