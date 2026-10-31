import { describe, expect, it } from 'vitest'
import { buildLanguageAlternates } from './utils'

const BASE = 'https://omdala.com'

describe('buildLanguageAlternates', () => {
  it('defaults to EN and VI only, plus x-default', () => {
    expect(Object.keys(buildLanguageAlternates('/trust')).sort()).toEqual(['en', 'vi', 'x-default'])
  })

  it('emits exactly the locales passed in', () => {
    const result = buildLanguageAlternates('/trust', { locales: ['en', 'vi', 'ja'] })
    expect(Object.keys(result).sort()).toEqual(['en', 'ja', 'vi', 'x-default'])
    expect(result.ja).toBe(`${BASE}/ja/trust`)
  })

  it('does not emit locales that were not passed in', () => {
    const result = buildLanguageAlternates('/trust', { locales: ['en'] })
    expect(Object.keys(result).sort()).toEqual(['en', 'x-default'])
  })

  it('puts the default locale at the unprefixed path and others under their prefix', () => {
    const result = buildLanguageAlternates('/faq')
    expect(result).toEqual({ 'x-default': `${BASE}/faq`, en: `${BASE}/faq`, vi: `${BASE}/vi/faq` })
  })

  it('maps the home page to / and /vi', () => {
    const result = buildLanguageAlternates('/')
    expect(result.en).toBe(`${BASE}/`)
    expect(result.vi).toBe(`${BASE}/vi`)
  })

  it('strips a locale prefix from the input path, including locales not being emitted', () => {
    expect(buildLanguageAlternates('/vi/faq').en).toBe(`${BASE}/faq`)
    expect(buildLanguageAlternates('/vi/faq').vi).toBe(`${BASE}/vi/faq`)
    const fromZh = buildLanguageAlternates('/zh/faq')
    expect(fromZh.en).toBe(`${BASE}/faq`)
    expect(Object.keys(fromZh)).not.toContain('zh')
  })
})
