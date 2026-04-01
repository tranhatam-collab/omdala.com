'use client'

import { resolveLanguage, type OmdalaLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export function useWebLocale(): OmdalaLanguage {
  const [locale, setLocale] = useState<OmdalaLanguage>('en')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const lang = resolveLanguage(new URLSearchParams(window.location.search).get('lang'))
    setLocale(lang)
  }, [])

  return locale
}
