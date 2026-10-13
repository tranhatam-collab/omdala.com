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

const LANGUAGE_LABELS: Record<OmdalaLanguage, string> = {
  en: 'EN',
  vi: 'VI',
  zh: 'ZH',
  es: 'ES',
  ja: 'JA',
  ko: 'KO',
}

export interface LanguageSwitcherProps {
  classPrefix?: string
}

export function LanguageSwitcher({ classPrefix = 'language-switcher' }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const [currentLanguage, setCurrentLanguage] = useState<OmdalaLanguage>('en')

  useEffect(() => {
    setCurrentLanguage(resolveLanguage(new URLSearchParams(window.location.search).get('lang')))
  }, [pathname])

  return (
    <div className={classPrefix} aria-label="Language selector">
      {OMDALA_LANGUAGES.map((language) => {
        const label = LANGUAGE_LABELS[language]

        if (!isReadyLanguage(language)) {
          return (
            <span
              key={language}
              className={`${classPrefix}__item ${classPrefix}__item--disabled`}
              title="Coming soon"
            >
              {label}
            </span>
          )
        }

        const isActive = currentLanguage === language
        return (
          <Link
            key={language}
            href={withLanguageParam(pathname, language)}
            className={`${classPrefix}__item${isActive ? ` ${classPrefix}__item--active` : ''}`}
            onClick={() => {
              setCurrentLanguage(language)
              window.dispatchEvent(
                new CustomEvent('omdala:language-changed', { detail: { language } }),
              )
            }}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
