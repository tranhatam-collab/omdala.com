'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'
import type { WebLocale } from './content'

export function useWebLocale(): WebLocale {
  const [locale, setLocale] = useState<WebLocale>('en')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const lang = resolveLanguage(new URLSearchParams(window.location.search).get('lang'))
    setLocale(lang === 'vi' ? 'vi' : 'en')
  }, [])

  return locale
}
