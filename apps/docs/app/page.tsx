'use client'

import { pickLanguageValue, resolveLanguage } from '@omdala/core'
import { useLocationSearchParam } from '@omdala/ui'
import { LocaleLink } from './components/LocaleLink'

export default function DocsHomePage() {
  const language = resolveLanguage(useLocationSearchParam('lang'))
  const copy = {
    title: { en: 'OMDALA Documentation', vi: 'Tài liệu OMDALA', zh: 'OMDALA 文档', es: 'Documentación OMDALA', ja: 'OMDALA ドキュメント', ko: 'OMDALA 문서' },
    lead: { en: 'Platform guides, API reference, trust logic, and system architecture.', vi: 'Hướng dẫn nền tảng, tham chiếu API, logic niềm tin và kiến trúc hệ thống.', zh: '平台指南、API 参考、信任逻辑与系统架构。', es: 'Guías de plataforma, referencia API, lógica de confianza y arquitectura del sistema.', ja: 'プラットフォームガイド、API リファレンス、信頼ロジック、システムアーキテクチャ。', ko: '플랫폼 가이드, API 레퍼런스, 신뢰 로직, 시스템 아키텍처.' },
    platform: { en: 'Platform overview', vi: 'Tổng quan nền tảng', zh: '平台概览', es: 'Resumen de plataforma', ja: 'プラットフォーム概要', ko: '플랫폼 개요' },
    api: { en: 'API reference', vi: 'Tham chiếu API', zh: 'API 参考', es: 'Referencia API', ja: 'API リファレンス', ko: 'API 레퍼런스' },
    trust: { en: 'Trust system', vi: 'Hệ thống niềm tin', zh: '信任系统', es: 'Sistema de confianza', ja: '信頼システム', ko: '신뢰 시스템' },
  } as const

  return (
    <main>
      <h1>{pickLanguageValue(language, copy.title)}</h1>
      <p>{pickLanguageValue(language, copy.lead)}</p>
      <nav>
        <LocaleLink href="/platform">{pickLanguageValue(language, copy.platform)}</LocaleLink>
        <LocaleLink href="/api">{pickLanguageValue(language, copy.api)}</LocaleLink>
        <LocaleLink href="/trust">{pickLanguageValue(language, copy.trust)}</LocaleLink>
      </nav>
    </main>
  )
}
