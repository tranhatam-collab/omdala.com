export const OMDALA_LANGUAGES = ['en', 'vi', 'zh', 'es', 'ja', 'ko'] as const
export const OMDALA_READY_LANGUAGES = ['en', 'vi', 'zh', 'es', 'ja', 'ko'] as const
export const OMDALA_DEFAULT_LANGUAGE = 'en' as const

export type OmdalaLanguage = (typeof OMDALA_LANGUAGES)[number]
export type OmdalaLocalizedValue<T = string> = Record<OmdalaLanguage, T>

export function pickLanguageValue<T>(
  language: OmdalaLanguage,
  values: OmdalaLocalizedValue<T>,
): T {
  return values[language]
}

export function resolveLanguage(value: string | null | undefined): OmdalaLanguage {
  if (!value) {
    return OMDALA_DEFAULT_LANGUAGE
  }

  return OMDALA_LANGUAGES.includes(value as OmdalaLanguage)
    ? (value as OmdalaLanguage)
    : OMDALA_DEFAULT_LANGUAGE
}

export function isReadyLanguage(language: OmdalaLanguage): boolean {
  return OMDALA_READY_LANGUAGES.includes(language as (typeof OMDALA_READY_LANGUAGES)[number])
}

export function withLanguageParam(path: string, language: OmdalaLanguage): string {
  if (!path.startsWith('/')) {
    return path
  }

  const url = new URL(path, 'https://omdala.local')
  if (language === 'en') {
    url.searchParams.delete('lang')
  } else {
    url.searchParams.set('lang', language)
  }

  const query = url.searchParams.toString()
  return `${url.pathname}${query ? `?${query}` : ''}${url.hash}`
}

export function getLanguageFromPath(pathname: string | null | undefined): OmdalaLanguage {
  if (!pathname) {
    return OMDALA_DEFAULT_LANGUAGE
  }

  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]
  return resolveLanguage(firstSegment)
}

export function stripLanguageFromPath(pathname: string): string {
  if (!pathname.startsWith('/')) {
    return pathname
  }

  const url = new URL(pathname, 'https://omdala.local')
  const segments = url.pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]

  if (!firstSegment || !OMDALA_LANGUAGES.includes(firstSegment as OmdalaLanguage)) {
    const query = url.searchParams.toString()
    return `${url.pathname}${query ? `?${query}` : ''}${url.hash}`
  }

  const nextPathname = `/${segments.slice(1).join('/')}`
  const query = url.searchParams.toString()
  return `${nextPathname === '/' ? '/' : nextPathname}${query ? `?${query}` : ''}${url.hash}`
}

export function withLanguagePath(path: string, language: OmdalaLanguage): string {
  if (!path.startsWith('/')) {
    return path
  }

  const url = new URL(path, 'https://omdala.local')
  url.searchParams.delete('lang')

  const basePath = stripLanguageFromPath(`${url.pathname}${url.search}${url.hash}`)
  const normalized = new URL(basePath, 'https://omdala.local')
  const pathname = normalized.pathname === '/' ? '/' : normalized.pathname.replace(/\/+$/g, '')
  const prefixedPath =
    language === OMDALA_DEFAULT_LANGUAGE
      ? pathname
      : pathname === '/'
        ? `/${language}`
        : `/${language}${pathname}`

  const query = normalized.searchParams.toString()
  return `${prefixedPath}${query ? `?${query}` : ''}${normalized.hash}`
}
