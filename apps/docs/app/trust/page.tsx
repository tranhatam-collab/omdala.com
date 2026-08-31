'use client'

import { pickLanguageValue, resolveLanguage } from '@omdala/core'
import { useLocationSearchParam } from '@omdala/ui'

export default function TrustDocsPage() {
  const language = resolveLanguage(useLocationSearchParam('lang'))
  const copy = {
    title: { en: 'OMDALA Trust System', vi: 'Hệ thống niềm tin OMDALA', zh: 'OMDALA 信任系统', es: 'Sistema de confianza OMDALA', ja: 'OMDALA 信頼システム', ko: 'OMDALA 신뢰 시스템' },
    body: { en: 'Trust in OMDALA is derived from verification, proof, completion, behavior, economic history, and governance signals. It is designed to be explainable, auditable, and action-relevant.', vi: 'Niềm tin trong OMDALA được xây từ xác thực, bằng chứng, mức hoàn thành, hành vi, lịch sử kinh tế và tín hiệu quản trị. Hệ thống được thiết kế để có thể giải thích, kiểm toán và gắn chặt với hành động.', zh: 'OMDALA 中的信任来自验证、证明、完成度、行为、经济历史与治理信号。它被设计为可解释、可审计并与行动紧密相关。', es: 'La confianza en OMDALA se deriva de verificación, pruebas, cumplimiento, comportamiento, historial económico y señales de gobernanza. Está diseñada para ser explicable, auditable y relevante para la acción.', ja: 'OMDALA の信頼は、検証、証明、完了度、行動、経済履歴、ガバナンス信号から導かれます。説明可能で、監査可能で、行動に結びつくよう設計されています。', ko: 'OMDALA의 신뢰는 검증, 증명, 완료도, 행동, 경제 이력, 거버넌스 신호로부터 형성됩니다. 설명 가능하고, 감사 가능하며, 행동과 연결되도록 설계되었습니다.' },
  } as const

  return (
    <main>
      <h1>{pickLanguageValue(language, copy.title)}</h1>
      <p>{pickLanguageValue(language, copy.body)}</p>
    </main>
  )
}
