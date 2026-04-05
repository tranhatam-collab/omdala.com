export type WebLocale = 'en' | 'vi' | 'zh' | 'es' | 'ja' | 'ko'

export type LocalizedText = {
  en: string
  vi: string
  zh?: string
  es?: string
  ja?: string
  ko?: string
}

export function pickText(locale: WebLocale, text: LocalizedText): string {
  return text[locale] || text.en
}

export const homeContent = {
  hero: {
    eyebrow: {
      en: 'Verified Coordination Infrastructure',
      vi: 'Hạ tầng điều phối có kiểm chứng',
    },
    title: {
      en: 'OMDALA — The Operating Layer for Real-World Value.',
      vi: 'OMDALA — Lớp vận hành cho giá trị thế giới thực.',
    },
    lead: {
      en: 'From Current Reality to Desired Reality — coordinated, verified, and trusted. OMDALA connects people, places, and resources into a single coordination system where value is activated, outcomes are proven, and trust compounds over time.',
      vi: 'Từ Thực tại hiện có đến Thực tại mong muốn — được điều phối, kiểm chứng và tin cậy. OMDALA kết nối con người, địa điểm và tài nguyên vào một hệ thống thống nhất, nơi giá trị được kích hoạt, kết quả được chứng minh và niềm tin tích lũy theo thời gian.',
    },
    ctaPrimary: { en: 'Start Building Reality', vi: 'Bắt đầu kiến tạo', zh: '开始构建现实', es: 'Empieza a construir la realidad', ja: '現実の構築を開始', ko: '현실 구축 시작' },
    ctaSecondary: { en: 'Explore the System', vi: 'Khám phá hệ thống', zh: '探索系统', es: 'Explorar el sistema', ja: 'システムを探索', ko: '시스템 탐색' },
    ctaDocs: { en: 'Open Docs', vi: 'Mở tài liệu', zh: '打开文档', es: 'Abrir documentos', ja: 'ドキュメントを開く', ko: '문서 열기' },
  },
  loop: {
    eyebrow: { en: 'Core Loop', vi: 'Vòng lặp cốt lõi', zh: '核心循环', es: 'Bucle central', ja: 'コアループ', ko: '핵심 루프' },
    title: {
      en: 'How OMDALA Works',
      vi: 'Cách OMDALA vận hành',
    },
    items: [
      {
        title: { en: '1. See Value', vi: '1. Thấy giá trị', zh: '1. 发现价值', es: '1. Ver valor', ja: '1. 価値を見る', ko: '1. 가치 발견' },
        copy: {
          en: 'Discover people, places, and resources around you.',
          vi: 'Khám phá con người, địa điểm và tài nguyên xung quanh bạn.',
        },
      },
      {
        title: { en: '2. Activate It', vi: '2. Kích hoạt', zh: '2. 激活它', es: '2. Actívalo', ja: '2. 活性化する', ko: '2. 활성화' },
        copy: {
          en: 'Structure resources and define desired outcomes.',
          vi: 'Cấu trúc hóa tài nguyên và xác định kết quả mong muốn.',
        },
      },
      {
        title: { en: '3. Prove It', vi: '3. Chứng minh', zh: '3. 证明它', es: '3. Pruébalo', ja: '3. 証明する', ko: '3. 증명' },
        copy: {
          en: 'Execute commitments and attach verifiable proof.',
          vi: 'Thực thi cam kết và đính kèm bằng chứng có thể kiểm chứng.',
        },
      },
      {
        title: { en: '4. Compound It', vi: '4. Tích lũy', zh: '4. 建立信任', es: '4. Compónelo', ja: '4. 蓄積する', ko: '4. 축적' },
        copy: {
          en: 'Build trust that grows with every completed action.',
          vi: 'Xây dựng niềm tin lớn mạnh sau mỗi hành động hoàn tất.',
        },
      },
    ],
  },
  stateTransition: {
    eyebrow: { en: 'State Transition Layer', vi: 'Lớp chuyển đổi trạng thái', zh: '状态转换层', es: 'Capa de Transición de Estado', ja: '状態移行レイヤー', ko: '상태 전환 레이어' },
    title: {
      en: 'From Current Reality to Desired Reality',
      vi: 'Từ thực tại hiện có đến thực tại mong muốn',
    },
    copy: {
      en: 'Every node in OMDALA has a current state and a desired state. The system continuously plans and executes transitions between them — using real resources, real commitments, and verifiable outcomes.',
      vi: 'Mỗi node trong OMDALA đều có một trạng thái hiện tại và trạng thái mong muốn. Hệ thống liên tục lập kế hoạch và thực thi việc chuyển đổi giữa chúng — sử dụng tài nguyên thật, cam kết thật và kết quả có thể kiểm chứng.',
    },
    concepts: [
      { en: 'Current State', vi: 'Trạng thái hiện tại', zh: '当前状态', es: 'Estado actual', ja: '現在の状態', ko: '현재 상태' },
      { en: 'Desired State', vi: 'Trạng thái mong muốn', zh: '期望状态', es: 'Estado deseado', ja: '望ましい状態', ko: '원하는 상태' },
      { en: 'Transition Path', vi: 'Đường dẫn chuyển đổi', zh: '转换路径', es: 'Ruta de transición', ja: '移行パス', ko: '전환 경로' },
      { en: 'Constraints', vi: 'Các ràng buộc', zh: '约束条件', es: 'Restricciones', ja: '制約', ko: '제약 조건' },
      { en: 'Outcomes', vi: 'Kết quả', zh: '结果', es: 'Resultados', ja: '結果', ko: '결과' },
    ],
  },
  commitments: {
    eyebrow: { en: 'Commitments Engine', vi: 'Động cơ cam kết', zh: '承诺引擎', es: 'Motor de Compromisos', ja: 'コミットメントエンジン', ko: '약속 엔진' },
    title: {
      en: 'Coordination Through Commitments',
      vi: 'Điều phối thông qua cam kết',
    },
    copy: {
      en: 'Offers and requests are just the surface. At the core of OMDALA is a commitment engine — where nodes define what they will do, under what conditions, and how success is verified.',
      vi: 'Đề nghị và nhu cầu chỉ là bề mặt. Cốt lõi của OMDALA là một động cơ cam kết — nơi các node xác định họ sẽ làm gì, dưới điều kiện nào, và sự thành công được xác thực ra sao.',
    },
    features: [
      { en: 'Multi-party commitments', vi: 'Cam kết đa bên', zh: '多方承诺', es: 'Compromisos multipartitos', ja: '複数パーティのコミットメント', ko: '다자간 약속' },
      { en: 'Conditional execution', vi: 'Thực thi có điều kiện', zh: '条件执行', es: 'Ejecución condicional', ja: '条件付き実行', ko: '조건부 실행' },
      { en: 'Deadlines & consequences', vi: 'Thời hạn & hệ quả', zh: '截止日期和后果', es: 'Plazos y consecuencias', ja: '期限と結果', ko: '마감일 및 결과' },
      { en: 'Approval flows', vi: 'Luồng phê duyệt', zh: '审批流程', es: 'Flujos de aprobación', ja: '承認フロー', ko: '승인 흐름' },
    ],
  },
  trust: {
    eyebrow: { en: 'Proof & Trust System', vi: 'Hệ thống bằng chứng & niềm tin', zh: '证明与信任系统', es: 'Sistema de prueba y confianza', ja: '証明および信頼システム', ko: '증명 및 신뢰 시스템' },
    title: {
      en: 'Trust Is Built, Not Claimed',
      vi: 'Niềm tin được xây dựng, không phải tự xưng',
    },
    copy: {
      en: 'Trust in OMDALA is not based on ratings alone. It is built from verifiable actions, completed commitments, and transparent governance.',
      vi: 'Niềm tin trong OMDALA không chỉ dựa trên đánh giá. Nó được xây từ các hành động có thể kiểm chứng, cam kết đã hoàn tất, và sự quản trị minh bạch.',
    },
    signals: [
      { en: 'Verified identity', vi: 'Định danh xác thực', zh: '已验证身份', es: 'Identidad verificada', ja: '検証済みのID', ko: '확인된 신원' },
      { en: 'Proof of completion', vi: 'Bằng chứng hoàn thành', zh: '完成证明', es: 'Prueba de finalización', ja: '完了の証明', ko: '완료 증명' },
      { en: 'Behavioral history', vi: 'Lịch sử hành vi', zh: '行为历史', es: 'Historial de comportamiento', ja: '行動履歴', ko: '행동 이력' },
      { en: 'Governance decisions', vi: 'Quyết định quản trị', zh: '治理决定', es: 'Decisiones de gobernanza', ja: 'ガバナンス決定', ko: '거버넌스 결정' },
    ],
  },
  governance: {
    eyebrow: { en: 'AGI-Safe Governance', vi: 'Quản trị an toàn cho AGI', zh: '通用人工智能安全治理', es: 'Gobernanza segura para AGI', ja: 'AGIの安全なガバナンス', ko: 'AGI 안전 거버넌스' },
    title: {
      en: 'Human-Governed, Machine-Operated',
      vi: 'Con người quản trị, máy móc vận hành',
    },
    copy: {
      en: 'All actions — human or AI — must pass through policy and governance. OMDALA ensures that every transition is auditable, explainable, and reversible when needed.',
      vi: 'Mọi hành động — của người hay AI — đều phải đi qua chính sách và quản trị. OMDALA đảm bảo mọi quá trình chuyển đổi đều có thể kiểm toán, giải thích và đảo ngược khi cần.',
    },
  },
  systemMap: {
    eyebrow: { en: 'System Map', vi: 'Bản đồ hệ thống', zh: '系统地图', es: 'Mapa del sistema', ja: 'システムマップ', ko: '시스템 맵' },
    title: {
      en: 'The OMDALA System',
      vi: 'Hệ thống OMDALA',
    },
    layers: [
      { en: 'Brand Layer', vi: 'Lớp thương hiệu', zh: '品牌层', es: 'Capa de marca', ja: 'ブランドレイヤー', ko: '브랜드 레이어' },
      { en: 'App Layer', vi: 'Lớp ứng dụng', zh: '应用层', es: 'Capa de aplicación', ja: 'アプリレイヤー', ko: '앱 레이어' },
      { en: 'Trust Layer', vi: 'Lớp niềm tin', zh: '信任层', es: 'Capa de confianza', ja: '信頼レイヤー', ko: '신뢰 레이어' },
      { en: 'Proof Layer', vi: 'Lớp bằng chứng', zh: '证明层', es: 'Capa de prueba', ja: '証明レイヤー', ko: '증명 레이어' },
      { en: 'Graph Layer', vi: 'Lớp đồ thị', zh: '图层', es: 'Capa de gráficos', ja: 'グラフレイヤー', ko: '그래프 레이어' },
      { en: 'API Layer', vi: 'Lớp API', zh: 'API 层', es: 'Capa API', ja: 'APIレイヤー', ko: 'API 레이어' },
      { en: 'AI Layer', vi: 'Lớp AI', zh: 'AI 层', es: 'Capa de IA', ja: 'AIレイヤー', ko: 'AI 레이어' },
    ],
  },
  useCases: {
    eyebrow: { en: 'Use Cases', vi: 'Trường hợp sử dụng', zh: '用例', es: 'Casos de uso', ja: '使用例', ko: '사용 사례' },
    title: {
      en: 'What You Can Do',
      vi: 'Những gì bạn có thể làm',
    },
    examples: [
      { en: 'Eliminate overdue payments', vi: 'Xóa bỏ nợ quá hạn', zh: '消除逾期付款', es: 'Eliminar pagos atrasados', ja: '延滞支払いを排除する', ko: '연체료 제거' },
      { en: 'Activate idle resources', vi: 'Kích hoạt tài nguyên nhàn rỗi', zh: '激活闲置资源', es: 'Activar recursos inactivos', ja: 'アイドル状態のリソースをアクティブ化する', ko: '유휴 리소스 활성화' },
      { en: 'Coordinate teams and communities', vi: 'Điều phối đội ngũ và cộng đồng', zh: '协调团队和社区', es: 'Coordinar equipos y comunidades', ja: 'チームとコミュニティの調整', ko: '팀 및 커뮤니티 조정' },
      { en: 'Deliver outcomes with proof', vi: 'Giao kết quả kèm bằng chứng', zh: '交付带有证明的结果', es: 'Entregar resultados con pruebas', ja: '証明付きの結果を提供する', ko: '증명과 함께 결과 제공' },
    ],
  },
  ctaFinal: {
    title: {
      en: 'Build Your Reality with OMDALA',
      vi: 'Kiến tạo thực tại của bạn cùng OMDALA',
    },
    primary: { en: 'Start Now', vi: 'Bắt đầu ngay', zh: '现在开始', es: 'Empezar ahora', ja: '今すぐ始める', ko: '지금 시작하기' },
    secondary: { en: 'Talk to Us', vi: 'Trò chuyện với chúng tôi', zh: '联系我们', es: 'Habla con nosotros', ja: 'お問い合わせ', ko: '문의하기' },
  }
} as const

export const definitionContent = {
  hero: {
    eyebrow: { en: 'Definition', vi: 'Định nghĩa', zh: 'Definition', es: 'Definition', ja: 'Definition', ko: 'Definition' },
    title: {
      en: 'OMDALA is the master platform layer for coordinated value.',
      vi: 'OMDALA là lớp nền tảng chủ để điều phối giá trị.',
    },
    lead: {
      en: 'It is not a tourism site, a generic marketplace, or a decorative AI wrapper. It is the operating layer that makes identity, resources, trust, and action work together.',
      vi: 'Đây không phải trang du lịch, sàn giao dịch chung chung hay lớp AI trang trí. Đây là lớp vận hành giúp định danh, tài nguyên, niềm tin và hành động phối hợp với nhau.',
    },
  },
  cards: [
    {
      title: { en: 'What it is', vi: 'Đây là gì', zh: 'What it is', es: 'What it is', ja: 'What it is', ko: 'What it is' },
      copy: {
        en: 'A platform for coordinating people, places, organizations, resources, and outcomes.',
        vi: 'Một nền tảng điều phối con người, địa điểm, tổ chức, tài nguyên và kết quả.',
      },
    },
    {
      title: { en: 'What it is not', vi: 'Không phải gì', zh: 'What it is not', es: 'What it is not', ja: 'What it is not', ko: 'What it is not' },
      copy: {
        en: 'A noisy feed, a thin directory, a one-feature app, or an AI chatbot with no system role.',
        vi: 'Không phải newsfeed ồn ào, danh bạ mỏng, ứng dụng một tính năng hay chatbot AI không vai trò hệ thống.',
      },
    },
    {
      title: { en: 'Where it sits', vi: 'Vị trí của nó', zh: 'Where it sits', es: 'Where it sits', ja: 'Where it sits', ko: 'Where it sits' },
      copy: {
        en: 'At the masterbrand level: web, app, API, docs, trust, and admin surfaces all flow from it.',
        vi: 'Ở tầng thương hiệu chủ: các bề mặt web, app, API, docs, trust và admin đều xuất phát từ đây.',
      },
    },
  ],
  layers: {
    eyebrow: { en: 'Core Layers', vi: 'Các lớp cốt lõi', zh: 'Core Layers', es: 'Core Layers', ja: 'Core Layers', ko: 'Core Layers' },
    title: {
      en: 'The platform is designed as five layers working together',
      vi: 'Nền tảng được thiết kế gồm 5 lớp phối hợp',
    },
    items: [
      { en: 'Identity: nodes, roles, ownership, visibility, and trust baseline.', vi: 'Định danh: node, vai trò, quyền sở hữu, mức hiển thị và nền niềm tin.', zh: 'Identity: nodes, roles, ownership, visibility, and trust baseline.', es: 'Identity: nodes, roles, ownership, visibility, and trust baseline.', ja: 'Identity: nodes, roles, ownership, visibility, and trust baseline.', ko: 'Identity: nodes, roles, ownership, visibility, and trust baseline.' },
      { en: 'Resources: time, space, skill, knowledge, capacity, and underused assets.', vi: 'Tài nguyên: thời gian, không gian, kỹ năng, tri thức, năng lực và tài sản nhàn rỗi.', zh: 'Resources: time, space, skill, knowledge, capacity, and underused assets.', es: 'Resources: time, space, skill, knowledge, capacity, and underused assets.', ja: 'Resources: time, space, skill, knowledge, capacity, and underused assets.', ko: 'Resources: time, space, skill, knowledge, capacity, and underused assets.' },
      { en: 'Coordination: offers, requests, matching, messaging, bookings, and tasks.', vi: 'Điều phối: đề nghị, nhu cầu, ghép nối, nhắn tin, đặt lịch và tác vụ.', zh: 'Coordination: offers, requests, matching, messaging, bookings, and tasks.', es: 'Coordination: offers, requests, matching, messaging, bookings, and tasks.', ja: 'Coordination: offers, requests, matching, messaging, bookings, and tasks.', ko: 'Coordination: offers, requests, matching, messaging, bookings, and tasks.' },
      { en: 'Trust: verification, proof, behavior, governance, and explainable reputation.', vi: 'Niềm tin: xác thực, bằng chứng, hành vi, quản trị và uy tín có thể giải thích.', zh: 'Trust: verification, proof, behavior, governance, and explainable reputation.', es: 'Trust: verification, proof, behavior, governance, and explainable reputation.', ja: 'Trust: verification, proof, behavior, governance, and explainable reputation.', ko: 'Trust: verification, proof, behavior, governance, and explainable reputation.' },
      { en: 'Intelligence: AI planning, orchestration, prioritization, and action support.', vi: 'Trí tuệ: lập kế hoạch AI, điều phối, ưu tiên và hỗ trợ hành động.', zh: 'Intelligence: AI planning, orchestration, prioritization, and action support.', es: 'Intelligence: AI planning, orchestration, prioritization, and action support.', ja: 'Intelligence: AI planning, orchestration, prioritization, and action support.', ko: 'Intelligence: AI planning, orchestration, prioritization, and action support.' },
    ],
  },
} as const

export const processContent = {
  hero: {
    eyebrow: { en: 'System Logic', vi: 'Logic hệ thống', zh: 'System Logic', es: 'System Logic', ja: 'System Logic', ko: 'System Logic' },
    title: {
      en: 'OMDALA works by turning hidden capacity into structured action.',
      vi: 'OMDALA vận hành bằng cách biến năng lực ẩn thành hành động có cấu trúc.',
    },
    lead: {
      en: 'The platform is built around one compounding loop: see what exists, match the right fit, move to action, store proof, and improve future outcomes.',
      vi: 'Nền tảng xoay quanh một vòng lặp tích lũy: thấy rõ hiện trạng, ghép đúng đối tượng, chuyển sang hành động, lưu bằng chứng và cải thiện kết quả tương lai.',
    },
  },
  steps: [
    {
      title: { en: '1. Map the node', vi: '1. Lập bản đồ node', zh: '1. Map the node', es: '1. Map the node', ja: '1. Map the node', ko: '1. Map the node' },
      copy: { en: 'Capture identity, goals, roles, availability, assets, and current trust state.', vi: 'Ghi nhận định danh, mục tiêu, vai trò, mức sẵn sàng, tài sản và trạng thái niềm tin hiện tại.', zh: 'Capture identity, goals, roles, availability, assets, and current trust state.', es: 'Capture identity, goals, roles, availability, assets, and current trust state.', ja: 'Capture identity, goals, roles, availability, assets, and current trust state.', ko: 'Capture identity, goals, roles, availability, assets, and current trust state.' },
    },
    {
      title: { en: '2. Normalize the resource', vi: '2. Chuẩn hóa tài nguyên', zh: '2. Normalize the resource', es: '2. Normalize the resource', ja: '2. Normalize the resource', ko: '2. Normalize the resource' },
      copy: { en: 'Turn loose information into resource objects, offers, requests, and operational states.', vi: 'Biến thông tin rời rạc thành đối tượng tài nguyên, đề nghị, nhu cầu và trạng thái vận hành.', zh: 'Turn loose information into resource objects, offers, requests, and operational states.', es: 'Turn loose information into resource objects, offers, requests, and operational states.', ja: 'Turn loose information into resource objects, offers, requests, and operational states.', ko: 'Turn loose information into resource objects, offers, requests, and operational states.' },
    },
    {
      title: { en: '3. Score the fit', vi: '3. Chấm điểm phù hợp', zh: '3. Score the fit', es: '3. Score the fit', ja: '3. Score the fit', ko: '3. Score the fit' },
      copy: { en: 'Use matching signals such as trust, timing, relevance, locality, capacity, and intent.', vi: 'Dùng tín hiệu ghép nối như niềm tin, thời điểm, mức liên quan, địa phương, năng lực và ý định.', zh: 'Use matching signals such as trust, timing, relevance, locality, capacity, and intent.', es: 'Use matching signals such as trust, timing, relevance, locality, capacity, and intent.', ja: 'Use matching signals such as trust, timing, relevance, locality, capacity, and intent.', ko: 'Use matching signals such as trust, timing, relevance, locality, capacity, and intent.' },
    },
    {
      title: { en: '4. Convert to execution', vi: '4. Chuyển thành thực thi', zh: '4. Convert to execution', es: '4. Convert to execution', ja: '4. Convert to execution', ko: '4. Convert to execution' },
      copy: { en: 'Draft messages, create tasks, open bookings, and guide follow-through with AI assistance.', vi: 'Soạn nhắn tin, tạo tác vụ, mở đặt lịch và dẫn dắt theo đuổi với hỗ trợ AI.', zh: 'Draft messages, create tasks, open bookings, and guide follow-through with AI assistance.', es: 'Draft messages, create tasks, open bookings, and guide follow-through with AI assistance.', ja: 'Draft messages, create tasks, open bookings, and guide follow-through with AI assistance.', ko: 'Draft messages, create tasks, open bookings, and guide follow-through with AI assistance.' },
    },
    {
      title: { en: '5. Record proof', vi: '5. Ghi nhận bằng chứng', zh: '5. Record proof', es: '5. Record proof', ja: '5. Record proof', ko: '5. Record proof' },
      copy: { en: 'Attach receipts, confirmations, outputs, endorsements, and verification artifacts.', vi: 'Gắn biên nhận, xác nhận, đầu ra, bảo chứng và tạo tác xác thực.', zh: 'Attach receipts, confirmations, outputs, endorsements, and verification artifacts.', es: 'Attach receipts, confirmations, outputs, endorsements, and verification artifacts.', ja: 'Attach receipts, confirmations, outputs, endorsements, and verification artifacts.', ko: 'Attach receipts, confirmations, outputs, endorsements, and verification artifacts.' },
    },
    {
      title: { en: '6. Compound trust', vi: '6. Tích lũy niềm tin', zh: '6. Compound trust', es: '6. Compound trust', ja: '6. Compound trust', ko: '6. Compound trust' },
      copy: { en: 'Use outcomes to increase discoverability, reduce risk, and improve future opportunity quality.', vi: 'Dùng kết quả để tăng khả năng khám phá, giảm rủi ro và nâng chất lượng cơ hội tương lai.', zh: 'Use outcomes to increase discoverability, reduce risk, and improve future opportunity quality.', es: 'Use outcomes to increase discoverability, reduce risk, and improve future opportunity quality.', ja: 'Use outcomes to increase discoverability, reduce risk, and improve future opportunity quality.', ko: 'Use outcomes to increase discoverability, reduce risk, and improve future opportunity quality.' },
    },
  ],
} as const

export const audiencePages = {
  experts: {
    hero: {
      eyebrow: { en: 'For Experts', vi: 'Dành cho chuyên gia', zh: 'For Experts', es: 'For Experts', ja: 'For Experts', ko: 'For Experts' },
      title: { en: 'Turn expertise into structured, trusted opportunity.', vi: 'Biến chuyên môn thành cơ hội có cấu trúc và đáng tin.', zh: 'Turn expertise into structured, trusted opportunity.', es: 'Turn expertise into structured, trusted opportunity.', ja: 'Turn expertise into structured, trusted opportunity.', ko: 'Turn expertise into structured, trusted opportunity.' },
      lead: {
        en: 'OMDALA helps specialists, advisors, creators, and operators package time, knowledge, and credibility into offers, requests, and repeatable trust-backed workflows.',
        vi: 'OMDALA giúp chuyên gia, cố vấn, nhà sáng tạo và người vận hành đóng gói thời gian, tri thức và uy tín thành đề nghị, nhu cầu và luồng công việc lặp lại dựa trên niềm tin.',
      },
    },
    cards: [
      {
        title: { en: 'Package your value', vi: 'Đóng gói giá trị của bạn', zh: 'Package your value', es: 'Package your value', ja: 'Package your value', ko: 'Package your value' },
        copy: { en: 'Convert expertise, availability, and goals into clear offers and operational objects.', vi: 'Chuyển chuyên môn, mức sẵn sàng và mục tiêu thành đề nghị rõ ràng và đối tượng vận hành.', zh: 'Convert expertise, availability, and goals into clear offers and operational objects.', es: 'Convert expertise, availability, and goals into clear offers and operational objects.', ja: 'Convert expertise, availability, and goals into clear offers and operational objects.', ko: 'Convert expertise, availability, and goals into clear offers and operational objects.' },
      },
      {
        title: { en: 'Improve signal quality', vi: 'Nâng chất lượng tín hiệu', zh: 'Improve signal quality', es: 'Improve signal quality', ja: 'Improve signal quality', ko: 'Improve signal quality' },
        copy: { en: 'Use proof, verification, and completion history to make discovery more trustworthy.', vi: 'Dùng bằng chứng, xác thực và lịch sử hoàn thành để tăng độ tin cậy khi được khám phá.', zh: 'Use proof, verification, and completion history to make discovery more trustworthy.', es: 'Use proof, verification, and completion history to make discovery more trustworthy.', ja: 'Use proof, verification, and completion history to make discovery more trustworthy.', ko: 'Use proof, verification, and completion history to make discovery more trustworthy.' },
      },
      {
        title: { en: 'Act faster', vi: 'Hành động nhanh hơn', zh: 'Act faster', es: 'Act faster', ja: 'Act faster', ko: 'Act faster' },
        copy: { en: 'Move from idea to outreach, booking, pricing, and task lists with AI support.', vi: 'Đi từ ý tưởng đến tiếp cận, đặt lịch, định giá và danh sách tác vụ với hỗ trợ AI.', zh: 'Move from idea to outreach, booking, pricing, and task lists with AI support.', es: 'Move from idea to outreach, booking, pricing, and task lists with AI support.', ja: 'Move from idea to outreach, booking, pricing, and task lists with AI support.', ko: 'Move from idea to outreach, booking, pricing, and task lists with AI support.' },
      },
    ],
  },
  hosts: {
    hero: {
      eyebrow: { en: 'For Hosts', vi: 'Dành cho điểm đón', zh: 'For Hosts', es: 'For Hosts', ja: 'For Hosts', ko: 'For Hosts' },
      title: { en: 'Turn place capacity into higher-quality utilization.', vi: 'Biến năng lực địa điểm thành mức khai thác chất lượng cao hơn.', zh: 'Turn place capacity into higher-quality utilization.', es: 'Turn place capacity into higher-quality utilization.', ja: 'Turn place capacity into higher-quality utilization.', ko: 'Turn place capacity into higher-quality utilization.' },
      lead: {
        en: 'Hosts need more than listings. They need fit, timing, trust, and operational follow-through. OMDALA is designed to structure that full loop.',
        vi: 'Điểm đón cần nhiều hơn danh sách hiển thị. Họ cần mức phù hợp, thời điểm, niềm tin và theo đuổi vận hành. OMDALA được thiết kế để cấu trúc toàn bộ vòng lặp đó.',
      },
    },
    items: [
      { en: 'Model spaces, availability, and place rules as structured resources.', vi: 'Mô hình hóa không gian, mức sẵn sàng và quy tắc địa điểm thành tài nguyên có cấu trúc.', zh: 'Model spaces, availability, and place rules as structured resources.', es: 'Model spaces, availability, and place rules as structured resources.', ja: 'Model spaces, availability, and place rules as structured resources.', ko: 'Model spaces, availability, and place rules as structured resources.' },
      { en: 'Match against trust level, purpose, timing, and expected operational fit.', vi: 'Ghép nối theo mức niềm tin, mục tiêu, thời điểm và mức phù hợp vận hành kỳ vọng.', zh: 'Match against trust level, purpose, timing, and expected operational fit.', es: 'Match against trust level, purpose, timing, and expected operational fit.', ja: 'Match against trust level, purpose, timing, and expected operational fit.', ko: 'Match against trust level, purpose, timing, and expected operational fit.' },
      { en: 'Use proofs and historical outcomes to strengthen future bookings.', vi: 'Dùng bằng chứng và kết quả lịch sử để củng cố các lần đặt lịch tương lai.', zh: 'Use proofs and historical outcomes to strengthen future bookings.', es: 'Use proofs and historical outcomes to strengthen future bookings.', ja: 'Use proofs and historical outcomes to strengthen future bookings.', ko: 'Use proofs and historical outcomes to strengthen future bookings.' },
      { en: 'Move from inquiry to action with messaging, tasks, and booking states.', vi: 'Đi từ yêu cầu đến hành động bằng nhắn tin, tác vụ và trạng thái đặt lịch.', zh: 'Move from inquiry to action with messaging, tasks, and booking states.', es: 'Move from inquiry to action with messaging, tasks, and booking states.', ja: 'Move from inquiry to action with messaging, tasks, and booking states.', ko: 'Move from inquiry to action with messaging, tasks, and booking states.' },
    ],
  },
  communities: {
    hero: {
      eyebrow: { en: 'For Communities', vi: 'Dành cho cộng đồng', zh: 'For Communities', es: 'For Communities', ja: 'For Communities', ko: 'For Communities' },
      title: { en: 'Run groups, assets, and governance with more clarity.', vi: 'Vận hành nhóm, tài sản và quản trị rõ ràng hơn.', zh: 'Run groups, assets, and governance with more clarity.', es: 'Run groups, assets, and governance with more clarity.', ja: 'Run groups, assets, and governance with more clarity.', ko: 'Run groups, assets, and governance with more clarity.' },
      lead: {
        en: 'Communities become stronger when shared resources, roles, proof, and coordination live in one calm system instead of fragmented threads and manual workarounds.',
        vi: 'Cộng đồng mạnh hơn khi tài nguyên chung, vai trò, bằng chứng và điều phối nằm trong một hệ thống thống nhất thay vì các luồng rời rạc và xử lý thủ công.',
      },
    },
    cards: [
      { title: { en: 'Shared resources', vi: 'Tài nguyên dùng chung', zh: 'Shared resources', es: 'Shared resources', ja: 'Shared resources', ko: 'Shared resources' }, copy: { en: 'Track assets, availability, events, and responsibilities across the group.', vi: 'Theo dõi tài sản, mức sẵn sàng, sự kiện và trách nhiệm trong toàn nhóm.', zh: 'Track assets, availability, events, and responsibilities across the group.', es: 'Track assets, availability, events, and responsibilities across the group.', ja: 'Track assets, availability, events, and responsibilities across the group.', ko: 'Track assets, availability, events, and responsibilities across the group.' } },
      { title: { en: 'Member trust', vi: 'Niềm tin thành viên', zh: 'Member trust', es: 'Member trust', ja: 'Member trust', ko: 'Member trust' }, copy: { en: 'Build visible reliability through proof, participation, role history, and governance logs.', vi: 'Xây dựng độ tin cậy nhìn thấy được qua bằng chứng, mức tham gia, lịch sử vai trò và nhật ký quản trị.', zh: 'Build visible reliability through proof, participation, role history, and governance logs.', es: 'Build visible reliability through proof, participation, role history, and governance logs.', ja: 'Build visible reliability through proof, participation, role history, and governance logs.', ko: 'Build visible reliability through proof, participation, role history, and governance logs.' } },
      { title: { en: 'Operational memory', vi: 'Bộ nhớ vận hành', zh: 'Operational memory', es: 'Operational memory', ja: 'Operational memory', ko: 'Operational memory' }, copy: { en: 'Keep community actions auditable so valuable knowledge does not disappear into chat.', vi: 'Giữ hành động cộng đồng có thể kiểm toán để tri thức giá trị không biến mất trong luồng chat.', zh: 'Keep community actions auditable so valuable knowledge does not disappear into chat.', es: 'Keep community actions auditable so valuable knowledge does not disappear into chat.', ja: 'Keep community actions auditable so valuable knowledge does not disappear into chat.', ko: 'Keep community actions auditable so valuable knowledge does not disappear into chat.' } },
    ],
  },
} as const

export const trustContent = {
  hero: {
    eyebrow: { en: 'Trust by Design', vi: 'Niềm tin theo thiết kế', zh: 'Trust by Design', es: 'Trust by Design', ja: 'Trust by Design', ko: 'Trust by Design' },
    title: { en: 'Trust is infrastructure, not decoration.', vi: 'Niềm tin là hạ tầng, không phải trang trí.', zh: 'Trust is infrastructure, not decoration.', es: 'Trust is infrastructure, not decoration.', ja: 'Trust is infrastructure, not decoration.', ko: 'Trust is infrastructure, not decoration.' },
    lead: {
      en: 'OMDALA does not reduce trust to stars and vibes. It treats trust as a system built from evidence, behavior, completion, governance, and explainable visibility rules.',
      vi: 'OMDALA không rút gọn niềm tin thành sao đánh giá cảm tính. Hệ thống xem niềm tin là cấu trúc được xây từ bằng chứng, hành vi, mức hoàn thành, quản trị và quy tắc hiển thị có thể giải thích.',
    },
  },
  cards: [
    { title: { en: 'Verification', vi: 'Xác thực', zh: 'Verification', es: 'Verification', ja: 'Verification', ko: 'Verification' }, copy: { en: 'Identity, ownership, payment, affiliation, and other factual checks where appropriate.', vi: 'Định danh, quyền sở hữu, thanh toán, liên kết và các kiểm tra sự thật khi phù hợp.', zh: 'Identity, ownership, payment, affiliation, and other factual checks where appropriate.', es: 'Identity, ownership, payment, affiliation, and other factual checks where appropriate.', ja: 'Identity, ownership, payment, affiliation, and other factual checks where appropriate.', ko: 'Identity, ownership, payment, affiliation, and other factual checks where appropriate.' } },
    { title: { en: 'Proof', vi: 'Bằng chứng', zh: 'Proof', es: 'Proof', ja: 'Proof', ko: 'Proof' }, copy: { en: 'Receipts, confirmations, outputs, attendance, delivery, and completion evidence.', vi: 'Biên nhận, xác nhận, đầu ra, điểm danh, bàn giao và bằng chứng hoàn thành.', zh: 'Receipts, confirmations, outputs, attendance, delivery, and completion evidence.', es: 'Receipts, confirmations, outputs, attendance, delivery, and completion evidence.', ja: 'Receipts, confirmations, outputs, attendance, delivery, and completion evidence.', ko: 'Receipts, confirmations, outputs, attendance, delivery, and completion evidence.' } },
    { title: { en: 'Behavior', vi: 'Hành vi', zh: 'Behavior', es: 'Behavior', ja: 'Behavior', ko: 'Behavior' }, copy: { en: 'Response quality, reliability, cancellation patterns, dispute history, and follow-through.', vi: 'Chất lượng phản hồi, độ tin cậy, mẫu hủy, lịch sử tranh chấp và khả năng theo đuổi.', zh: 'Response quality, reliability, cancellation patterns, dispute history, and follow-through.', es: 'Response quality, reliability, cancellation patterns, dispute history, and follow-through.', ja: 'Response quality, reliability, cancellation patterns, dispute history, and follow-through.', ko: 'Response quality, reliability, cancellation patterns, dispute history, and follow-through.' } },
    { title: { en: 'Governance', vi: 'Quản trị', zh: 'Governance', es: 'Governance', ja: 'Governance', ko: 'Governance' }, copy: { en: 'Warnings, overrides, moderation actions, and audit trails for sensitive decisions.', vi: 'Cảnh báo, ghi đè, hành động kiểm duyệt và dấu vết kiểm toán cho quyết định nhạy cảm.', zh: 'Warnings, overrides, moderation actions, and audit trails for sensitive decisions.', es: 'Warnings, overrides, moderation actions, and audit trails for sensitive decisions.', ja: 'Warnings, overrides, moderation actions, and audit trails for sensitive decisions.', ko: 'Warnings, overrides, moderation actions, and audit trails for sensitive decisions.' } },
  ],
} as const

export const visionContent = {
  hero: {
    eyebrow: { en: 'Long-Term Vision', vi: 'Tầm nhìn dài hạn', zh: 'Long-Term Vision', es: 'Long-Term Vision', ja: 'Long-Term Vision', ko: 'Long-Term Vision' },
    title: {
      en: 'Design narrow enough to launch, strong enough to matter for decades.',
      vi: 'Thiết kế đủ gọn để ra mắt, đủ vững để có ý nghĩa trong nhiều thập kỷ.',
    },
    lead: {
      en: 'OMDALA should start with sharp operational usefulness, but the architecture must be able to grow into a durable layer for trust-backed human coordination across many domains.',
      vi: 'OMDALA nên bắt đầu bằng tính hữu dụng vận hành sắc nét, nhưng kiến trúc phải đủ khả năng phát triển thành lớp điều phối con người bền vững dựa trên niềm tin qua nhiều lĩnh vực.',
    },
  },
  horizons: [
    { title: { en: '10-year horizon', vi: 'Tầm nhìn 10 năm', zh: '10-year horizon', es: '10-year horizon', ja: '10-year horizon', ko: '10-year horizon' }, copy: { en: 'Become indispensable for experts, hosts, communities, and small business nodes.', vi: 'Trở thành hạ tầng không thể thiếu cho chuyên gia, điểm đón, cộng đồng và các node doanh nghiệp nhỏ.', zh: 'Become indispensable for experts, hosts, communities, and small business nodes.', es: 'Become indispensable for experts, hosts, communities, and small business nodes.', ja: 'Become indispensable for experts, hosts, communities, and small business nodes.', ko: 'Become indispensable for experts, hosts, communities, and small business nodes.' } },
    { title: { en: '25-year horizon', vi: 'Tầm nhìn 25 năm', zh: '25-year horizon', es: '25-year horizon', ja: '25-year horizon', ko: '25-year horizon' }, copy: { en: 'Operate as shared infrastructure for distributed networks, assets, and local economies.', vi: 'Vận hành như hạ tầng chung cho mạng lưới phân tán, tài sản và kinh tế địa phương.', zh: 'Operate as shared infrastructure for distributed networks, assets, and local economies.', es: 'Operate as shared infrastructure for distributed networks, assets, and local economies.', ja: 'Operate as shared infrastructure for distributed networks, assets, and local economies.', ko: 'Operate as shared infrastructure for distributed networks, assets, and local economies.' } },
    { title: { en: '100-year horizon', vi: 'Tầm nhìn 100 năm', zh: '100-year horizon', es: '100-year horizon', ja: '100-year horizon', ko: '100-year horizon' }, copy: { en: 'Remain valuable because trust, coordination, proof, and resource activation are durable needs.', vi: 'Duy trì giá trị vì niềm tin, điều phối, bằng chứng và kích hoạt tài nguyên là nhu cầu bền vững.', zh: 'Remain valuable because trust, coordination, proof, and resource activation are durable needs.', es: 'Remain valuable because trust, coordination, proof, and resource activation are durable needs.', ja: 'Remain valuable because trust, coordination, proof, and resource activation are durable needs.', ko: 'Remain valuable because trust, coordination, proof, and resource activation are durable needs.' } },
  ],
} as const

export const faqContent = {
  hero: {
    title: {
      en: 'Clear answers before the build expands.',
      vi: 'Trả lời rõ ràng trước khi hệ thống mở rộng.',
    },
    lead: {
      en: 'The fastest way to keep the platform aligned is to answer the category and system questions early and consistently.',
      vi: 'Cách nhanh nhất để giữ nền tảng đi đúng hướng là trả lời các câu hỏi về danh mục và hệ thống từ sớm, nhất quán.',
    },
  },
  questions: [
    {
      question: { en: 'Is OMDALA a marketplace?', vi: 'OMDALA có phải là marketplace không?', zh: 'Is OMDALA a marketplace?', es: 'Is OMDALA a marketplace?', ja: 'Is OMDALA a marketplace?', ko: 'Is OMDALA a marketplace?' },
      answer: {
        en: 'Not primarily. Marketplace behavior can exist inside the system, but OMDALA is broader: it handles identity, trust, matching, action, and proof.',
        vi: 'Không phải trọng tâm chính. Hành vi marketplace có thể tồn tại trong hệ thống, nhưng OMDALA rộng hơn: xử lý định danh, niềm tin, ghép nối, hành động và bằng chứng.',
      },
    },
    {
      question: { en: 'Is OMDALA only for AI workflows?', vi: 'OMDALA chỉ dành cho workflow AI?', zh: 'Is OMDALA only for AI workflows?', es: 'Is OMDALA only for AI workflows?', ja: 'Is OMDALA only for AI workflows?', ko: 'Is OMDALA only for AI workflows?' },
      answer: {
        en: 'No. AI is a support layer for planning and orchestration. The product is ultimately about real operational outcomes.',
        vi: 'Không. AI là lớp hỗ trợ cho lập kế hoạch và điều phối. Giá trị cốt lõi vẫn là kết quả vận hành thực tế.',
      },
    },
    {
      question: { en: 'Who should use it first?', vi: 'Ai nên dùng trước?', zh: 'Who should use it first?', es: 'Who should use it first?', ja: 'Who should use it first?', ko: 'Who should use it first?' },
      answer: {
        en: 'Operators with real capacity to activate: experts, hosts, communities, and small business nodes.',
        vi: 'Những người vận hành có năng lực thật để kích hoạt: chuyên gia, điểm đón, cộng đồng và các node doanh nghiệp nhỏ.',
      },
    },
    {
      question: { en: 'Why is trust central?', vi: 'Vì sao niềm tin là trung tâm?', zh: 'Why is trust central?', es: 'Why is trust central?', ja: 'Why is trust central?', ko: 'Why is trust central?' },
      answer: {
        en: 'Because weak trust destroys matching quality, discoverability, and repeat outcomes faster than feature gaps do.',
        vi: 'Vì niềm tin yếu sẽ phá chất lượng ghép nối, khả năng khám phá và kết quả lặp lại nhanh hơn nhiều so với thiếu tính năng.',
      },
    },
  ],
} as const

export const contactContent = {
  hero: {
    eyebrow: { en: 'Contact Surface', vi: 'Bề mặt liên hệ', zh: 'Contact Surface', es: 'Contact Surface', ja: 'Contact Surface', ko: 'Contact Surface' },
    title: {
      en: 'Contact the live OMDALA inbox layer.',
      vi: 'Liên hệ lớp inbox đang hoạt động của OMDALA.',
    },
    lead: {
      en: 'Public contact now routes through the same mail system the platform uses for support, app onboarding, and operator response.',
      vi: 'Liên hệ công khai hiện đi qua cùng hệ thống mail mà nền tảng dùng cho hỗ trợ, onboarding ứng dụng và phản hồi vận hành.',
    },
  },
  form: {
    title: { en: 'Contact form', vi: 'Biểu mẫu liên hệ', zh: 'Contact form', es: 'Contact form', ja: 'Contact form', ko: 'Contact form' },
    copy: {
      en: 'Use this form for support, partnership discussions, trust questions, or product routing.',
      vi: 'Dùng biểu mẫu này cho hỗ trợ, trao đổi hợp tác, câu hỏi về niềm tin hoặc điều hướng sản phẩm.',
    },
  },
  inboxes: {
    title: { en: 'Official inboxes', vi: 'Hộp thư chính thức', zh: 'Official inboxes', es: 'Official inboxes', ja: 'Official inboxes', ko: 'Official inboxes' },
    copy: {
      en: 'These inboxes are the public routing points the web, app, docs, and operator layer can use immediately.',
      vi: 'Các hộp thư này là điểm điều hướng công khai mà lớp web, app, docs và vận hành có thể dùng ngay.',
    },
    cards: [
      { label: { en: 'General', vi: 'Tổng quát', zh: 'General', es: 'General', ja: 'General', ko: 'General' }, key: 'hello' },
      { label: { en: 'Support', vi: 'Hỗ trợ', zh: 'Support', es: 'Support', ja: 'Support', ko: 'Support' }, key: 'support' },
      { label: { en: 'App', vi: 'Ứng dụng', zh: 'App', es: 'App', ja: 'App', ko: 'App' }, key: 'app' },
      { label: { en: 'Trust', vi: 'Niềm tin', zh: 'Trust', es: 'Trust', ja: 'Trust', ko: 'Trust' }, key: 'trust' },
    ],
  },
  notes: [
    { en: 'Auth and magic-link mail', vi: 'Mail xác thực và magic-link', key: 'noreply' },
    { en: 'Docs and API routing', vi: 'Điều hướng docs và API', key: 'docs' },
    { en: 'Admin operations', vi: 'Vận hành admin', key: 'admin' },
  ],
} as const
