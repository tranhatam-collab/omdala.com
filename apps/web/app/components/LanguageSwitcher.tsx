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
import { useEffect, useState, useRef } from 'react'

const LANGUAGE_CONFIG: Record<OmdalaLanguage, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇬🇧' },
  vi: { label: 'Tiếng Việt', flag: '🇻🇳' },
  zh: { label: '中文', flag: '🇨🇳' },
  es: { label: 'Español', flag: '🇪🇸' },
  ja: { label: '日本語', flag: '🇯🇵' },
  ko: { label: '한국어', flag: '🇰🇷' },
}

export function LanguageSwitcher() {
  const pathname = usePathname()
  const [currentLanguage, setCurrentLanguage] = useState<OmdalaLanguage>('en')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const currentPath = pathname

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const lang = resolveLanguage(new URLSearchParams(window.location.search).get('lang'))
    setCurrentLanguage(lang)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentConfig = LANGUAGE_CONFIG[currentLanguage] || LANGUAGE_CONFIG.en

  return (
    <div className="language-dropdown" ref={dropdownRef}>
      <button 
        className="language-dropdown__toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="language-dropdown__flag">{currentConfig.flag}</span>
        <span className="language-dropdown__code">{currentLanguage.toUpperCase()}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown__menu">
          {OMDALA_LANGUAGES.map((language) => {
            const isReady = isReadyLanguage(language)
            const href = withLanguageParam(currentPath, language)
            const isActive = currentLanguage === language
            const config = LANGUAGE_CONFIG[language]

            if (!isReady) return null

            return (
              <Link
                key={language}
                href={href}
                className={`language-dropdown__item ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="language-dropdown__flag">{config.flag}</span>
                <span className="language-dropdown__label">{config.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
