'use client'

import { pickLanguageValue, resolveLanguage } from '@omdala/core'
import { useLocationSearchParam } from '@omdala/ui'

export default function ApiDocsPage() {
  const language = resolveLanguage(useLocationSearchParam('lang'))
  const copy = {
    title: { en: 'OMDALA API Reference', vi: 'Tham chiếu API OMDALA', zh: 'OMDALA API 参考', es: 'Referencia API de OMDALA', ja: 'OMDALA API リファレンス', ko: 'OMDALA API 레퍼런스' },
    bodyBefore: { en: 'The master API is versioned under ', vi: 'API chủ được phiên bản hóa dưới ', zh: '主 API 在 ', es: 'La API maestra se versiona bajo ', ja: 'マスター API は ', ko: '마스터 API는 ' },
    bodyAfter: { en: ' (reality endpoints under /v2/reality). The route groups below are the ones currently implemented.', vi: ' (các endpoint reality nằm dưới /v2/reality). Các nhóm route dưới đây là những nhóm hiện đã triển khai.', zh: ' 进行版本化（reality 端点位于 /v2/reality）。下列路由组为当前已实现的部分。', es: ' (los endpoints reality están bajo /v2/reality). Los grupos de rutas siguientes son los implementados actualmente.', ja: ' 配下でバージョン管理されます（reality エンドポイントは /v2/reality）。以下は現在実装されているルートグループです。', ko: ' 아래에서 버전 관리됩니다(reality 엔드포인트는 /v2/reality). 아래 라우트 그룹은 현재 구현된 항목입니다.' },
  } as const
  // Only groups present in the services/api router.
  const routeGroups = ['/v1/auth', '/v1/account', '/v1/billing', '/v1/workspaces', '/v1/notifications', '/v1/analytics', '/v1/security', '/v1/ai', '/v1/contact', '/v2/reality'] as const

  return (
    <main>
      <h1>{pickLanguageValue(language, copy.title)}</h1>
      <p>
        {pickLanguageValue(language, copy.bodyBefore)}
        <code>/v1</code>
        {pickLanguageValue(language, copy.bodyAfter)}
      </p>
      <ul aria-label="API route groups">
        {routeGroups.map((group) => (
          <li key={group}>
            <code>{group}</code>
          </li>
        ))}
      </ul>
    </main>
  )
}
