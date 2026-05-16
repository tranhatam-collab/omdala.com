'use client'

import { pickLanguageValue, resolveLanguage, type OmdalaLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export default function PlatformDocsPage() {
  const [language, setLanguage] = useState<OmdalaLanguage>('en')
  const copy = {
    title: { en: 'OMDALA Platform Overview', vi: 'Tổng quan nền tảng OMDALA', zh: 'OMDALA 平台概览', es: 'Resumen de plataforma OMDALA', ja: 'OMDALA プラットフォーム概要', ko: 'OMDALA 플랫폼 개요' },
    body: { en: 'OMDALA is the master platform layer for identity, resources, matching, trust, AI-assisted orchestration, and real-world execution across public web, app, API, docs, and admin surfaces.', vi: 'OMDALA là lớp nền tảng chủ cho định danh, tài nguyên, ghép nối, niềm tin, điều phối có AI hỗ trợ và thực thi thực tế trên các bề mặt web công khai, app, API, docs và admin.', zh: 'OMDALA 是身份、资源、匹配、信任、AI 协调以及真实执行的主平台层，覆盖 public web、app、API、docs 与 admin。', es: 'OMDALA es la capa maestra de plataforma para identidad, recursos, matching, confianza, orquestación asistida por IA y ejecución real en web pública, app, API, docs y admin.', ja: 'OMDALA は、identity、resources、matching、trust、AI 支援オーケストレーション、そして実世界での実行を担うマスタープラットフォーム層であり、public web、app、API、docs、admin にまたがります。', ko: 'OMDALA는 identity, resources, matching, trust, AI 기반 orchestration, 그리고 실제 실행을 담당하는 마스터 플랫폼 레이어이며 public web, app, API, docs, admin 전반을 포괄합니다.' },
  } as const

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setLanguage(resolveLanguage(new URLSearchParams(window.location.search).get('lang')))
  }, [])

  return (
    <main>
      <h1>{pickLanguageValue(language, copy.title)}</h1>
      <p>{pickLanguageValue(language, copy.body)}</p>
    </main>
  )
}
