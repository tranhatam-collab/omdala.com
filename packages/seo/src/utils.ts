import { SEO_DEFAULTS } from './constants'

export type SeoLocale = 'en' | 'vi'
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
  const locales = options.locales ?? ['en', 'vi']
  const canonical = buildSeoUrl(path)
  const alternates: Record<SeoHreflang, string> = {
    en: canonical,
    vi: `${canonical}?lang=vi`,
    'x-default': canonical,
  }

  for (const locale of locales) {
    if (locale === defaultLocale) continue
    alternates[locale] = `${canonical}?lang=${locale}`
  }

  alternates[defaultLocale] = canonical

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
