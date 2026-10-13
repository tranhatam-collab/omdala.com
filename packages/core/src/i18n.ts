export const OMDALA_LANGUAGES = ['en', 'vi', 'zh', 'es', 'ja', 'ko'] as const
export const OMDALA_READY_LANGUAGES = ['en', 'vi', 'zh', 'es', 'ja', 'ko'] as const

export type OmdalaLanguage = (typeof OMDALA_LANGUAGES)[number]

export function resolveLanguage(value: string | null | undefined): OmdalaLanguage {
  if (!value) {
    return 'en'
  }

  return OMDALA_LANGUAGES.includes(value as OmdalaLanguage)
    ? (value as OmdalaLanguage)
    : 'en'
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
