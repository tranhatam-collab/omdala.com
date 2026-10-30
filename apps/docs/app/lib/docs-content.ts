// Localized docs copy. Rendered on the server per locale route (EN at /, VI under /vi).

export const HOME_COPY = {
  title: { en: 'OMDALA Documentation', vi: 'Tài liệu OMDALA', zh: 'OMDALA 文档', es: 'Documentación OMDALA', ja: 'OMDALA ドキュメント', ko: 'OMDALA 문서' },
  lead: { en: 'Platform guides, API reference, trust logic, and system architecture.', vi: 'Hướng dẫn nền tảng, tham chiếu API, logic niềm tin và kiến trúc hệ thống.', zh: '平台指南、API 参考、信任逻辑与系统架构。', es: 'Guías de plataforma, referencia API, lógica de confianza y arquitectura del sistema.', ja: 'プラットフォームガイド、API リファレンス、信頼ロジック、システムアーキテクチャ。', ko: '플랫폼 가이드, API 레퍼런스, 신뢰 로직, 시스템 아키텍처.' },
  platform: { en: 'Platform overview', vi: 'Tổng quan nền tảng', zh: '平台概览', es: 'Resumen de plataforma', ja: 'プラットフォーム概要', ko: '플랫폼 개요' },
  api: { en: 'API reference', vi: 'Tham chiếu API', zh: 'API 参考', es: 'Referencia API', ja: 'API リファレンス', ko: 'API 레퍼런스' },
  trust: { en: 'Trust system', vi: 'Hệ thống niềm tin', zh: '信任系统', es: 'Sistema de confianza', ja: '信頼システム', ko: '신뢰 시스템' },
} as const

export const PLATFORM_COPY = {
  title: { en: 'OMDALA Platform Overview', vi: 'Tổng quan nền tảng OMDALA', zh: 'OMDALA 平台概览', es: 'Resumen de plataforma OMDALA', ja: 'OMDALA プラットフォーム概要', ko: 'OMDALA 플랫폼 개요' },
  body: { en: 'OMDALA is the master platform layer for identity, resources, matching, trust, AI-assisted orchestration, and real-world execution across public web, app, API, docs, and admin surfaces.', vi: 'OMDALA là lớp nền tảng chủ cho định danh, tài nguyên, ghép nối, niềm tin, điều phối có AI hỗ trợ và thực thi thực tế trên các bề mặt web công khai, app, API, docs và admin.', zh: 'OMDALA 是身份、资源、匹配、信任、AI 协调以及真实执行的主平台层，覆盖 public web、app、API、docs 与 admin。', es: 'OMDALA es la capa maestra de plataforma para identidad, recursos, matching, confianza, orquestación asistida por IA y ejecución real en web pública, app, API, docs y admin.', ja: 'OMDALA は、identity、resources、matching、trust、AI 支援オーケストレーション、そして実世界での実行を担うマスタープラットフォーム層であり、public web、app、API、docs、admin にまたがります。', ko: 'OMDALA는 identity, resources, matching, trust, AI 기반 orchestration, 그리고 실제 실행을 담당하는 마스터 플랫폼 레이어이며 public web, app, API, docs, admin 전반을 포괄합니다.' },
} as const

export const API_COPY = {
  title: { en: 'OMDALA API Reference', vi: 'Tham chiếu API OMDALA', zh: 'OMDALA API 参考', es: 'Referencia API de OMDALA', ja: 'OMDALA API リファレンス', ko: 'OMDALA API 레퍼런스' },
  bodyBefore: { en: 'The master API is versioned under ', vi: 'API chủ được phiên bản hóa dưới ', zh: '主 API 在 ', es: 'La API maestra se versiona bajo ', ja: 'マスター API は ', ko: '마스터 API는 ' },
  bodyAfter: { en: ' (reality endpoints under /v2/reality). The route groups below are the ones currently implemented.', vi: ' (các endpoint reality nằm dưới /v2/reality). Các nhóm route dưới đây là những nhóm hiện đã triển khai.', zh: ' 进行版本化（reality 端点位于 /v2/reality）。下列路由组为当前已实现的部分。', es: ' (los endpoints reality están bajo /v2/reality). Los grupos de rutas siguientes son los implementados actualmente.', ja: ' 配下でバージョン管理されます（reality エンドポイントは /v2/reality）。以下は現在実装されているルートグループです。', ko: ' 아래에서 버전 관리됩니다(reality 엔드포인트는 /v2/reality). 아래 라우트 그룹은 현재 구현된 항목입니다.' },
} as const

export const TRUST_COPY = {
  title: { en: 'OMDALA Trust System', vi: 'Hệ thống niềm tin OMDALA', zh: 'OMDALA 信任系统', es: 'Sistema de confianza OMDALA', ja: 'OMDALA 信頼システム', ko: 'OMDALA 신뢰 시스템' },
  body: { en: 'Trust in OMDALA is derived from verification, proof, completion, behavior, economic history, and governance signals. It is designed to be explainable, auditable, and action-relevant.', vi: 'Niềm tin trong OMDALA được xây từ xác thực, bằng chứng, mức hoàn thành, hành vi, lịch sử kinh tế và tín hiệu quản trị. Hệ thống được thiết kế để có thể giải thích, kiểm toán và gắn chặt với hành động.', zh: 'OMDALA 中的信任来自验证、证明、完成度、行为、经济历史与治理信号。它被设计为可解释、可审计并与行动紧密相关。', es: 'La confianza en OMDALA se deriva de verificación, pruebas, cumplimiento, comportamiento, historial económico y señales de gobernanza. Está diseñada para ser explicable, auditable y relevante para la acción.', ja: 'OMDALA の信頼は、検証、証明、完了度、行動、経済履歴、ガバナンス信号から導かれます。説明可能で、監査可能で、行動に結びつくよう設計されています。', ko: 'OMDALA의 신뢰는 검증, 증명, 완료도, 행동, 경제 이력, 거버넌스 신호로부터 형성됩니다. 설명 가능하고, 감사 가능하며, 행동과 연결되도록 설계되었습니다.' },
} as const
