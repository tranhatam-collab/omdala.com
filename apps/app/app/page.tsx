'use client'

import { pickLanguageValue, resolveLanguage, type OmdalaLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'
import { LocaleLink } from './components/LocaleLink'

const COPY = {
  heroEyebrow: {
    en: 'OMDALA Product Line',
    vi: 'Dòng sản phẩm OMDALA',
    zh: 'OMDALA 产品系列',
    es: 'Línea de productos OMDALA',
    ja: 'OMDALA 製品ライン',
    ko: 'OMDALA 제품 라인',
  },
  heroTitle: {
    en: 'OMCode — AI Coding Workspace',
    vi: 'OMCode — Không gian lập trình AI',
    zh: 'OMCode — AI 编程工作区',
    es: 'OMCode — Espacio de programación con IA',
    ja: 'OMCode — AI コーディングワークスペース',
    ko: 'OMCode — AI 코딩 워크스페이스',
  },
  heroLead: {
    en: 'The first AI-powered coding workspace built for Vietnam. Write code, chat with AI, manage projects, and deploy — all in one unified platform.',
    vi: 'Không gian lập trình AI đầu tiên dành cho Việt Nam. Viết code, trò chuyện với AI, quản lý dự án và triển khai — tất cả trên một nền tảng thống nhất.',
    zh: '专为越南打造的首个 AI 驱动编程工作区。编写代码、与 AI 对话、管理项目并部署 — 全部在一个统一平台上完成。',
    es: 'El primer espacio de programación impulsado por IA construido para Vietnam. Escribe código, chatea con IA, gestiona proyectos y despliega — todo en una plataforma unificada.',
    ja: 'ベトナム向けに構築された初の AI 駆動型コーディングワークスペース。コードを書き、AI とチャットし、プロジェクトを管理し、デプロイ — すべて 1 つの統合プラットフォームで。',
    ko: '베트남을 위해 구축된 최초의 AI 기반 코딩 워크스페이스. 코드 작성, AI 와 채팅, 프로젝트 관리 및 배포 — 모두 하나의 통합 플랫폼에서.',
  },
  ctaTry: {
    en: 'Try for free',
    vi: 'Dùng thử miễn phí',
    zh: '免费试用',
    es: 'Probar gratis',
    ja: '無料で試す',
    ko: '무료 체험',
  },
  ctaPricing: {
    en: 'View pricing',
    vi: 'Xem bảng giá',
    zh: '查看价格',
    es: 'Ver precios',
    ja: '料金を見る',
    ko: '가격 보기',
  },
  pricingTitle: {
    en: 'Simple pricing',
    vi: 'Giá đơn giản',
    zh: '简单定价',
    es: 'Precios simples',
    ja: 'シンプルな料金',
    ko: '간단한 가격',
  },
  pricingSubtitle: {
    en: 'Start free. Scale as you grow.',
    vi: 'Bắt đầu miễn phí. Mở rộng theo nhu cầu.',
    zh: '免费开始。随成长扩展。',
    es: 'Comienza gratis. Escala a medida que creces.',
    ja: '無料で始める。成長に合わせてスケール。',
    ko: '무료로 시작하세요. 성장에 따라 확장하세요.',
  },
  freePlan: {
    en: 'Free',
    vi: 'Miễn phí',
    zh: '免费',
    es: 'Gratis',
    ja: '無料',
    ko: '무료',
  },
  freePrice: {
    en: '$0',
    vi: '0 ₫',
    zh: '¥0',
    es: '0 €',
    ja: '¥0',
    ko: '₩0',
  },
  freePeriod: {
    en: 'forever',
    vi: 'mãi mãi',
    zh: '永久',
    es: 'para siempre',
    ja: '永遠',
    ko: '영원히',
  },
  freeDesc: {
    en: 'For learners and hobbyists.',
    vi: 'Dành cho người học và sở thích.',
    zh: '面向学习者和爱好者。',
    es: 'Para estudiantes y aficionados.',
    ja: '学習者と趣味の人向け。',
    ko: '학습자와 취미인을 위한.',
  },
  proPlan: {
    en: 'Pro',
    vi: 'Chuyên nghiệp',
    zh: '专业版',
    es: 'Pro',
    ja: 'Pro',
    ko: 'Pro',
  },
  proPrice: {
    en: '$9',
    vi: '199.000 ₫',
    zh: '¥65',
    es: '9 €',
    ja: '¥1,350',
    ko: '₩12,000',
  },
  proPeriod: {
    en: '/month',
    vi: '/tháng',
    zh: '/月',
    es: '/mes',
    ja: '/月',
    ko: '/월',
  },
  proDesc: {
    en: 'For professional developers.',
    vi: 'Dành cho lập trình viên chuyên nghiệp.',
    zh: '面向专业开发者。',
    es: 'Para desarrolladores profesionales.',
    ja: 'プロの開発者向け。',
    ko: '전문 개발자를 위한.',
  },
  enterprisePlan: {
    en: 'Enterprise',
    vi: 'Doanh nghiệp',
    zh: '企业版',
    es: 'Empresarial',
    ja: 'エンタープライズ',
    ko: '엔터프라이즈',
  },
  enterprisePrice: {
    en: 'Custom',
    vi: 'Liên hệ',
    zh: '联系销售',
    es: 'Contactar',
    ja: 'お問い合わせ',
    ko: '문의',
  },
  enterpriseDesc: {
    en: 'For teams and organizations.',
    vi: 'Dành cho nhóm và tổ chức.',
    zh: '面向团队和组织。',
    es: 'Para equipos y organizaciones.',
    ja: 'チームと組織向け。',
    ko: '팀과 조직을 위한.',
  },
  featuresTitle: {
    en: 'Everything you need to ship faster',
    vi: 'Mọi thứ bạn cần để phát hành nhanh hơn',
    zh: '快速发布所需的一切',
    es: 'Todo lo que necesitas para lanzar más rápido',
    ja: 'より速くリリースするために必要なすべて',
    ko: '더 빠르게 출시하는 데 필요한 모든 것',
  },
  techTitle: {
    en: 'Built on modern technology',
    vi: 'Xây dựng trên công nghệ hiện đại',
    zh: '基于现代技术构建',
    es: 'Construido con tecnología moderna',
    ja: '最新技術で構築',
    ko: '현대 기술 기반',
  },
  useCasesTitle: {
    en: 'Who is OMCode for?',
    vi: 'OMCode dành cho ai?',
    zh: 'OMCode 适合谁？',
    es: '¿Para quién es OMCode?',
    ja: 'OMCode は誰のため？',
    ko: 'OMCode 누구를 위한 것인가?',
  },
  footerCopy: {
    en: '© 2026 IAI LLC. All rights reserved.',
    vi: '© 2026 IAI LLC. Mọi quyền được bảo lưu.',
    zh: '© 2026 IAI LLC. 保留所有权利。',
    es: '© 2026 IAI LLC. Todos los derechos reservados.',
    ja: '© 2026 IAI LLC. All rights reserved.',
    ko: '© 2026 IAI LLC. 모든 권리 보유.',
  },
} as const

const PRICING_FEATURES = {
  free: [
    { en: 'AI Chat (GPT-4o mini)', vi: 'Trò chuyện AI (GPT-4o mini)', zh: 'AI 聊天 (GPT-4o mini)', es: 'Chat IA (GPT-4o mini)', ja: 'AI チャット (GPT-4o mini)', ko: 'AI 채팅 (GPT-4o mini)' },
    { en: 'File manager', vi: 'Quản lý file', zh: '文件管理器', es: 'Gestor de archivos', ja: 'ファイルマネージャー', ko: '파일 관리자' },
    { en: '3 projects', vi: '3 dự án', zh: '3 个项目', es: '3 proyectos', ja: '3 プロジェクト', ko: '3 프로젝트' },
    { en: 'Community support', vi: 'Hỗ trợ cộng đồng', zh: '社区支持', es: 'Soporte comunitario', ja: 'コミュニティサポート', ko: '커뮤니티 지원' },
  ],
  pro: [
    { en: 'Everything in Free', vi: 'Mọi tính năng Miễn phí', zh: '免费版全部功能', es: 'Todo lo de Free', ja: '無料版の全機能', ko: '무료판 모든 기능' },
    { en: 'Advanced AI models (Claude, GPT-4o)', vi: 'Mô hình AI nâng cao (Claude, GPT-4o)', zh: '高级 AI 模型 (Claude, GPT-4o)', es: 'Modelos IA avanzados (Claude, GPT-4o)', ja: '高度 AI モデル (Claude, GPT-4o)', ko: '고급 AI 모델 (Claude, GPT-4o)' },
    { en: 'Unlimited projects', vi: 'Dự án không giới hạn', zh: '无限项目', es: 'Proyectos ilimitados', ja: '無制限プロジェクト', ko: '무제한 프로젝트' },
    { en: 'Git integration', vi: 'Tích hợp Git', zh: 'Git 集成', es: 'Integración Git', ja: 'Git 統合', ko: 'Git 통합' },
    { en: 'Cost dashboard', vi: 'Bảng chi phí', zh: '成本仪表板', es: 'Panel de costos', ja: 'コストダッシュボード', ko: '비용 대시보드' },
    { en: 'Priority support', vi: 'Hỗ trợ ưu tiên', zh: '优先支持', es: 'Soporte prioritario', ja: '優先サポート', ko: '우선 지원' },
  ],
  enterprise: [
    { en: 'Everything in Pro', vi: 'Mọi tính năng Pro', zh: '专业版全部功能', es: 'Todo lo de Pro', ja: 'Pro の全機能', ko: 'Pro 모든 기능' },
    { en: 'SSO / SAML', vi: 'SSO / SAML', zh: 'SSO / SAML', es: 'SSO / SAML', ja: 'SSO / SAML', ko: 'SSO / SAML' },
    { en: 'Audit logs', vi: 'Nhật ký kiểm toán', zh: '审计日志', es: 'Registros de auditoría', ja: '監査ログ', ko: '감사 로그' },
    { en: 'Custom AI model', vi: 'Mô hình AI tùy chỉnh', zh: '自定义 AI 模型', es: 'Modelo IA personalizado', ja: 'カスタム AI モデル', ko: '커스텀 AI 모델' },
    { en: 'Dedicated support', vi: 'Hỗ trợ chuyên biệt', zh: '专属支持', es: 'Soporte dedicado', ja: '専用サポート', ko: '전용 지원' },
    { en: 'SLA guarantee', vi: 'Cam kết SLA', zh: 'SLA 保证', es: 'Garantía SLA', ja: 'SLA 保証', ko: 'SLA 보증' },
  ],
} as const

const FEATURES = [
  {
    icon: '🤖',
    title: { en: 'AI Chat', vi: 'Trò chuyện AI', zh: 'AI 聊天', es: 'Chat IA', ja: 'AI チャット', ko: 'AI 채팅' },
    desc: { en: 'Talk to multiple AI models. Get code suggestions, explanations, and debugging help.', vi: 'Trò chuyện với nhiều mô hình AI. Nhận gợi ý code, giải thích và hỗ trợ debug.', zh: '与多个 AI 模型对话。获取代码建议、解释和调试帮助。', es: 'Habla con múltiples modelos de IA. Obtén sugerencias de código, explicaciones y ayuda para depurar.', ja: '複数の AI モデルと会話。コード提案、説明、デバッグ支援を受け取る。', ko: '여러 AI 모델과 대화. 코드 제안, 설명 및 디버깅 도움 받기.' },
  },
  {
    icon: '💻',
    title: { en: 'Code Editor', vi: 'Trình soạn thảo', zh: '代码编辑器', es: 'Editor de código', ja: 'コードエディタ', ko: '코드 편집기' },
    desc: { en: 'Monaco-based editor with syntax highlighting, IntelliSense, and auto-formatting.', vi: 'Trình soạn thảo Monaco với tô sáng cú pháp, IntelliSense và tự động format.', zh: '基于 Monaco 的编辑器，支持语法高亮、IntelliSense 和自动格式化。', es: 'Editor basado en Monaco con resaltado de sintaxis, IntelliSense y autoformato.', ja: 'Monaco ベースのエディタ。シンタックスハイライト、IntelliSense、自動フォーマット対応。', ko: 'Monaco 기반 에디터. 구문 강조, IntelliSense, 자동 포맷팅.' },
  },
  {
    icon: '🖥️',
    title: { en: 'Terminal', vi: 'Terminal', zh: '终端', es: 'Terminal', ja: 'ターミナル', ko: '터미널' },
    desc: { en: 'Built-in terminal with xterm.js. Run commands, install packages, and deploy.', vi: 'Terminal tích hợp xterm.js. Chạy lệnh, cài gói và triển khai.', zh: '基于 xterm.js 的内置终端。运行命令、安装包和部署。', es: 'Terminal integrada con xterm.js. Ejecuta comandos, instala paquetes y despliega.', ja: 'xterm.js 搭載の内蔵ターミナル。コマンド実行、パッケージインストール、デプロイ。', ko: 'xterm.js 기반 내장 터미널. 명령 실행, 패키지 설치 및 배포.' },
  },
  {
    icon: '📁',
    title: { en: 'File Manager', vi: 'Quản lý file', zh: '文件管理器', es: 'Gestor de archivos', ja: 'ファイルマネージャー', ko: '파일 관리자' },
    desc: { en: 'Drag-and-drop file explorer with Git integration and real-time sync.', vi: 'Trình quản lý file kéo thả với tích hợp Git và đồng bộ thời gian thực.', zh: '支持拖放的文件资源管理器，集成 Git 并实时同步。', es: 'Explorador de archivos con arrastrar y soltar, integración Git y sincronización en tiempo real.', ja: 'ドラッグ＆ドロップ対応ファイルエクスプローラ。Git 統合とリアルタイム同期。', ko: '드래그 앤 드롭 파일 탐색기. Git 통합 및 실시간 동기화.' },
  },
  {
    icon: '📊',
    title: { en: 'Project Tracker', vi: 'Theo dõi dự án', zh: '项目跟踪器', es: 'Seguimiento de proyectos', ja: 'プロジェクト追跡', ko: '프로젝트 추적' },
    desc: { en: 'Track tasks, milestones, and AI-generated project summaries.', vi: 'Theo dõi nhiệm vụ, cột mốc và tóm tắt dự án do AI tạo.', zh: '跟踪任务、里程碑和 AI 生成的项目摘要。', es: 'Rastrea tareas, hitos y resúmenes de proyectos generados por IA.', ja: 'タスク、マイルストーン、AI 生成プロジェクト概要の追跡。', ko: '작업, 마일스톤, AI 생성 프로젝트 요약 추적.' },
  },
  {
    icon: '💰',
    title: { en: 'Cost Dashboard', vi: 'Bảng chi phí', zh: '成本仪表板', es: 'Panel de costos', ja: 'コストダッシュボード', ko: '비용 대시보드' },
    desc: { en: 'Monitor AI usage costs by model and project in real-time.', vi: 'Giám sát chi phí sử dụng AI theo mô hình và dự án trong thời gian thực.', zh: '实时监控按模型和项目划分的 AI 使用成本。', es: 'Monitorea los costos de uso de IA por modelo y proyecto en tiempo real.', ja: 'モデルとプロジェクト別の AI 使用コストをリアルタイムで監視。', ko: '모델 및 프로젝트별 AI 사용 비용을 실시간으로 모니터링.' },
  },
] as const

const TECH_STACK = [
  { name: 'Next.js 16', desc: { en: 'App Router, RSC, Turbo', vi: 'App Router, RSC, Turbo', zh: 'App Router, RSC, Turbo', es: 'App Router, RSC, Turbo', ja: 'App Router, RSC, Turbo', ko: 'App Router, RSC, Turbo' } },
  { name: 'Monaco Editor', desc: { en: 'VS Code engine in browser', vi: 'Động cơ VS Code trong trình duyệt', zh: '浏览器中的 VS Code 引擎', es: 'Motor VS Code en el navegador', ja: 'ブラウザ内 VS Code エンジン', ko: '브라우저 내 VS Code 엔진' } },
  { name: 'isomorphic-git', desc: { en: 'Pure JS Git client', vi: 'Git client thuần JS', zh: '纯 JS Git 客户端', es: 'Cliente Git puro JS', ja: '純 JS Git クライアント', ko: '순수 JS Git 클라이언트' } },
  { name: 'xterm.js', desc: { en: 'Terminal emulator', vi: 'Trình giả lập terminal', zh: '终端模拟器', es: 'Emulador de terminal', ja: 'ターミナルエミュレータ', ko: '터미널 에뮬레이터' } },
  { name: 'Cloudflare Workers', desc: { en: 'Edge compute, D1, R2, KV', vi: 'Edge compute, D1, R2, KV', zh: '边缘计算, D1, R2, KV', es: 'Edge compute, D1, R2, KV', ja: 'エッジコンピュート, D1, R2, KV', ko: '엣지 컴퓨트, D1, R2, KV' } },
  { name: 'Hono', desc: { en: 'Lightweight web framework', vi: 'Web framework nhẹ', zh: '轻量级 Web 框架', es: 'Framework web ligero', ja: '軽量 Web フレームワーク', ko: '경량 웹 프레임워크' } },
] as const

const USE_CASES = [
  {
    icon: '👤',
    title: { en: 'Solo Developer', vi: 'Lập trình viên cá nhân', zh: '独立开发者', es: 'Desarrollador individual', ja: '個人開発者', ko: '개인 개발자' },
    desc: { en: 'Build side projects with AI assistance. No setup, no DevOps — just code and ship.', vi: 'Xây dựng dự án cá nhân với sự hỗ trợ AI. Không cần setup, không cần DevOps — chỉ viết code và phát hành.', zh: '在 AI 协助下构建副业项目。无需设置，无需 DevOps — 只管写代码和发布。', es: 'Construye proyectos personales con asistencia de IA. Sin configuración, sin DevOps — solo code y despliega.', ja: 'AI の支援を受けながらサイドプロジェクトを構築。セットアップ不要、DevOps 不要 — ただコードを書いてリリース。', ko: 'AI 지원으로 사이드 프로젝트 구축. 설정 없음, DevOps 없음 — 그냥 코드를 작성하고 출시.' },
  },
  {
    icon: '👥',
    title: { en: 'Team Lead', vi: 'Trưởng nhóm', zh: '团队负责人', es: 'Líder de equipo', ja: 'チームリード', ko: '팀 리드' },
    desc: { en: 'Review code, manage sprints, and track AI costs across your team.', vi: 'Review code, quản lý sprint và theo dõi chi phí AI trong nhóm.', zh: '审查代码、管理冲刺并跟踪团队的 AI 成本。', es: 'Revisa código, gestiona sprints y rastrea costos de IA en tu equipo.', ja: 'コードレビュー、スプリント管理、チーム全体の AI コスト追跡。', ko: '코드 검토, 스프린트 관리, 팀 전체 AI 비용 추적.' },
  },
  {
    icon: '🏢',
    title: { en: 'Agency', vi: 'Công ty agency', zh: '代理公司', es: 'Agencia', ja: '代理店', ko: '에이전시' },
    desc: { en: 'White-label workspaces for clients. Custom domains and SSO ready.', vi: 'Không gian làm việc white-label cho khách hàng. Tên miền tùy chỉnh và SSO sẵn sàng.', zh: '为客户提供白标工作区。支持自定义域名和 SSO。', es: 'Espacios de trabajo white-label para clientes. Dominios personalizados y SSO listo.', ja: 'クライアント向けホワイトラベルワークスペース。カスタムドメインと SSO 対応。', ko: '고객을 위한 화이트 라벨 워크스페이스. 커스텀 도메인 및 SSO 준비 완료.' },
  },
  {
    icon: '🎓',
    title: { en: 'Education', vi: 'Giáo dục', zh: '教育', es: 'Educación', ja: '教育', ko: '교육' },
    desc: { en: 'Teach coding with AI tutors. Student progress tracking and assignments.', vi: 'Dạy lập trình với gia sư AI. Theo dõi tiến độ học sinh và bài tập.', zh: '使用 AI 导师教授编程。学生进度跟踪和作业管理。', es: 'Enseña programación con tutores de IA. Seguimiento de progreso estudiantil y tareas.', ja: 'AI チューターでコーディングを教える。生徒の進捗追跡と課題管理。', ko: 'AI 튜터로 코딩 가르치기. 학생 진도 추적 및 과제 관리.' },
  },
] as const

export default function OmcodeLandingPage() {
  const [language, setLanguage] = useState<OmdalaLanguage>('vi')
  useEffect(() => {
    if (typeof window === 'undefined') return
    setLanguage(resolveLanguage(new URLSearchParams(window.location.search).get('lang')))
  }, [])

  const t = (copy: Record<OmdalaLanguage, string>) => pickLanguageValue(language, copy)

  return (
    <main style={{ minHeight: '100vh' }}>
      {/* HERO */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: 'clamp(4rem, 12vw, 8rem) 1.5rem clamp(3rem, 8vw, 5rem)',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <span className="eyebrow">{t(COPY.heroEyebrow)}</span>
        <h1 style={{ maxWidth: 'none', marginBottom: '1.2rem' }}>{t(COPY.heroTitle)}</h1>
        <p style={{
          fontSize: 'clamp(1.05rem, 2.2vw, 1.35rem)',
          color: 'var(--muted)',
          maxWidth: '56ch',
          lineHeight: 1.65,
          marginBottom: '2.2rem',
        }}>
          {t(COPY.heroLead)}
        </p>
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <LocaleLink href="/workspace" className="primary-action" style={{ width: 'auto', padding: '0.85rem 1.6rem', fontSize: '1rem' }}>
            {t(COPY.ctaTry)}
          </LocaleLink>
          <a href="#pricing" className="ghost-link" style={{ minHeight: '48px', padding: '0.85rem 1.6rem', fontSize: '1rem', fontWeight: 600 }}>
            {t(COPY.ctaPricing)}
          </a>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '3rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="eyebrow">{t(COPY.pricingTitle)}</span>
          <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>{t(COPY.pricingSubtitle)}</p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.2rem',
        }}>
          {(['free', 'pro', 'enterprise'] as const).map((tier) => (
            <div key={tier} className="surface" style={{
              padding: '2rem 1.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              borderRadius: '24px',
              border: tier === 'pro' ? '2px solid var(--accent)' : '1px solid var(--line)',
            }}>
              <div>
                <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.15rem', fontWeight: 700 }}>
                  {t(COPY[`${tier}Plan` as keyof typeof COPY])}
                </h3>
                <div style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', fontWeight: 700, color: 'var(--accent)', lineHeight: 1.1 }}>
                  {t(COPY[`${tier}Price` as keyof typeof COPY])}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                  {tier === 'enterprise' ? '' : t(COPY[`${tier}Period` as keyof typeof COPY])}
                </div>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: 0 }}>
                {t(COPY[`${tier}Desc` as keyof typeof COPY])}
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.8, flex: 1 }}>
                {PRICING_FEATURES[tier].map((f, i) => (
                  <li key={i}>{t(f as Record<OmdalaLanguage, string>)}</li>
                ))}
              </ul>
              <LocaleLink
                href={tier === 'enterprise' ? '/contact' : '/workspace'}
                className="primary-action"
                style={{ width: '100%', textAlign: 'center', marginTop: '0.5rem' }}
              >
                {tier === 'enterprise' ? t(COPY.enterprisePrice) : t(COPY.ctaTry)}
              </LocaleLink>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '3rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="eyebrow">{t(COPY.featuresTitle)}</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.2rem',
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="surface" style={{ padding: '1.6rem', borderRadius: '20px' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.6rem' }}>{f.icon}</div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>{t(f.title)}</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.94rem', lineHeight: 1.65 }}>{t(f.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TECH STACK */}
      <section style={{ padding: '3rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="eyebrow">{t(COPY.techTitle)}</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
        }}>
          {TECH_STACK.map((tech, i) => (
            <div key={i} style={{
              padding: '1.2rem',
              borderRadius: '16px',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              textAlign: 'center',
            }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem', color: 'var(--accent)' }}>{tech.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{t(tech.desc)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section style={{ padding: '3rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="eyebrow">{t(COPY.useCasesTitle)}</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.2rem',
        }}>
          {USE_CASES.map((uc, i) => (
            <div key={i} className="surface" style={{ padding: '1.6rem', borderRadius: '20px' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>{uc.icon}</div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>{t(uc.title)}</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{t(uc.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BOTTOM */}
      <section style={{
        padding: '4rem 1.5rem',
        textAlign: 'center',
        maxWidth: '700px',
        margin: '0 auto',
      }}>
        <h2 style={{ maxWidth: 'none', marginBottom: '1rem' }}>{t(COPY.heroTitle)}</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.8rem', fontSize: '1.05rem' }}>
          {t(COPY.heroLead)}
        </p>
        <LocaleLink href="/workspace" className="primary-action" style={{ width: 'auto', padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
          {t(COPY.ctaTry)}
        </LocaleLink>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--line)',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '0.88rem',
      }}>
        <div style={{ marginBottom: '0.6rem', fontWeight: 600, color: 'var(--text)' }}>OMCode by OMDALA</div>
        <div>{t(COPY.footerCopy)}</div>
        <div style={{ marginTop: '0.8rem', display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://omdala.com" style={{ color: 'var(--muted)' }}>omdala.com</a>
          <a href="https://iai.one" style={{ color: 'var(--muted)' }}>iai.one</a>
          <LocaleLink href="/workspace" style={{ color: 'var(--muted)' }}>Workspace</LocaleLink>
        </div>
      </footer>
    </main>
  )
}
