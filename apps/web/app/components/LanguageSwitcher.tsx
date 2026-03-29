'use client'

import {
  isReadyLanguage,
  OMDALA_LANGUAGES,
  type OmdalaLanguage,
  resolveLanguage,
  withLanguageParam,
} from '@omdala/core'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const LANGUAGE_LABELS: Record<(typeof OMDALA_LANGUAGES)[number], string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  ja: '日本語',
  ko: '한국어',
}

export function LanguageSwitcher() {
  const pathname = usePathname()
  const [currentLanguage, setCurrentLanguage] = useState<OmdalaLanguage>('en')
  const currentPath = pathname

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const lang = resolveLanguage(new URLSearchParams(window.location.search).get('lang'))
    setCurrentLanguage(lang)
  }, [pathname])

  return (
    <div className="language-switcher" aria-label="Language selector">
      {OMDALA_LANGUAGES.map((language) => {
        const isReady = isReadyLanguage(language)
        const href = withLanguageParam(currentPath, language)
        const isActive = currentLanguage === language

        if (!isReady) {
          return (
            <span
              key={language}
              className="language-switcher__item language-switcher__item--disabled"
              title="Coming soon"
            >
              {LANGUAGE_LABELS[language]}
            </span>
          )
        }

        return (
          <Link
            key={language}
            href={href}
            className={`language-switcher__item${isActive ? ' language-switcher__item--active' : ''}`}
          >
            {LANGUAGE_LABELS[language]}
          </Link>
        )
      })}
    </div>
  )
}
