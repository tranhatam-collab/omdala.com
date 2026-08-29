'use client'

import { pickLanguageValue, resolveLanguage } from '@omdala/core'
import { useLocationSearchParam } from '@omdala/ui'

export default function ApiDocsPage() {
  const language = resolveLanguage(useLocationSearchParam('lang'))
  const copy = {
    title: { en: 'OMDALA API Reference', vi: 'Tham chiếu API OMDALA', zh: 'OMDALA API 参考', es: 'Referencia API de OMDALA', ja: 'OMDALA API リファレンス', ko: 'OMDALA API 레퍼런스' },
    bodyBefore: { en: 'The master API is versioned under ', vi: 'API chủ được phiên bản hóa dưới ', zh: '主 API 在 ', es: 'La API maestra se versiona bajo ', ja: 'マスター API は ', ko: '마스터 API는 ' },
    bodyAfter: { en: ' and groups routes by identity, resources, offers, requests, matches, conversations, bookings, payments, proofs, trust, and admin actions.', vi: ' và nhóm route theo định danh, tài nguyên, đề nghị, nhu cầu, ghép nối, hội thoại, đặt lịch, thanh toán, bằng chứng, niềm tin và tác vụ admin.', zh: ' 进行版本化，并按身份、资源、提案、请求、匹配、会话、预订、支付、证明、信任与管理动作分组。', es: ' y agrupa rutas por identidad, recursos, ofertas, solicitudes, matches, conversaciones, reservas, pagos, pruebas, confianza y acciones admin.', ja: ' 配下でバージョン管理され、identity、resources、offers、requests、matches、conversations、bookings、payments、proofs、trust、admin actions ごとにルートを整理します。', ko: ' 아래에서 버전 관리되며 identity, resources, offers, requests, matches, conversations, bookings, payments, proofs, trust, admin actions 기준으로 라우트를 구성합니다.' },
  } as const

  return (
    <main>
      <h1>{pickLanguageValue(language, copy.title)}</h1>
      <p>
        {pickLanguageValue(language, copy.bodyBefore)}
        <code>/v1</code>
        {pickLanguageValue(language, copy.bodyAfter)}
      </p>
    </main>
  )
}
