import { describe, expect, it } from 'vitest'
import {
  OMDALA_LANGUAGES,
  OMDALA_READY_LANGUAGES,
  isReadyLanguage,
  resolveLanguage,
} from './i18n'

describe('language readiness', () => {
  it('lists only languages with complete content as ready', () => {
    expect([...OMDALA_READY_LANGUAGES]).toEqual(['en', 'vi'])
  })

  it('keeps every ready language a supported language', () => {
    for (const language of OMDALA_READY_LANGUAGES) {
      expect(OMDALA_LANGUAGES).toContain(language)
    }
  })

  it.each(['en', 'vi'] as const)('marks %s ready', (language) => {
    expect(isReadyLanguage(language)).toBe(true)
  })

  it.each(['zh', 'es', 'ja', 'ko'] as const)('marks %s not ready but still resolvable', (language) => {
    expect(isReadyLanguage(language)).toBe(false)
    expect(resolveLanguage(language)).toBe(language)
  })
})
