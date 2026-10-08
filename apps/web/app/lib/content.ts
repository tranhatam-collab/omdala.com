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
      zh: '经过验证的协调基础设施',
      es: 'Infraestructura de coordinación verificada',
      ja: '検証済みの調整インフラ',
      ko: '검증된 조정 인프라',
    },
    title: {
      en: 'OMDALA — Independent Platform for Real-World Coordination.',
      vi: 'OMDALA — Nền tảng độc lập cho điều phối đời thực.',
      zh: 'OMDALA — 面向现实世界协调的独立平台。',
      es: 'OMDALA — Plataforma independiente para la coordinación del mundo real.',
      ja: 'OMDALA — 現実世界の調整のための独立プラットフォーム。',
      ko: 'OMDALA — 현실 세계 조정을 위한 독립 플랫폼.',
    },
    lead: {
      en: 'OMDALA is a standalone platform for verified coordination. It brings people, places, resources, and execution into one system where value is activated, outcomes are proven, and trust compounds over time.',
      vi: 'OMDALA là nền tảng độc lập cho điều phối có kiểm chứng. Nền tảng này đưa con người, địa điểm, tài nguyên và thực thi vào một hệ thống nơi giá trị được kích hoạt, kết quả được chứng minh và niềm tin tích lũy theo thời gian.',
      zh: 'OMDALA 是一个面向可验证协调的独立平台。它将人、地点、资源与执行连接到同一系统中，让价值被激活、结果被证明、信任持续累积。',
      es: 'OMDALA es una plataforma independiente para la coordinación verificable. Reúne personas, lugares, recursos y ejecución en un solo sistema donde el valor se activa, los resultados se prueban y la confianza se acumula con el tiempo.',
      ja: 'OMDALA は検証可能な調整のための独立プラットフォームです。人、場所、資源、実行を一つのシステムにまとめ、価値を活性化し、成果を証明し、信頼を時間とともに積み上げます。',
      ko: 'OMDALA는 검증 가능한 조정을 위한 독립 플랫폼입니다. 사람, 장소, 자원, 실행을 하나의 시스템으로 묶어 가치를 활성화하고, 결과를 증명하며, 신뢰를 시간에 따라 축적합니다.',
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
      zh: 'OMDALA 如何运作',
      es: 'Cómo funciona OMDALA',
      ja: 'OMDALA の仕組み',
      ko: 'OMDALA 작동 방식',
    },
    items: [
      {
        title: { en: '1. See Value', vi: '1. Thấy giá trị', zh: '1. 发现价值', es: '1. Ver valor', ja: '1. 価値を見る', ko: '1. 가치 발견' },
        copy: {
          en: 'Discover people, places, and resources around you.',
          vi: 'Khám phá con người, địa điểm và tài nguyên xung quanh bạn.',
          zh: '发现你周围的人、地点和资源。',
          es: 'Descubre personas, lugares y recursos a tu alrededor.',
          ja: '身の回りの人、場所、資源を見つけます。',
          ko: '주변의 사람, 장소, 리소스를 발견합니다.',
        },
      },
      {
        title: { en: '2. Activate It', vi: '2. Kích hoạt', zh: '2. 激活它', es: '2. Actívalo', ja: '2. 活性化する', ko: '2. 활성화' },
        copy: {
          en: 'Structure resources and define desired outcomes.',
          vi: 'Cấu trúc hóa tài nguyên và xác định kết quả mong muốn.',
          zh: '结构化资源并定义期望结果。',
          es: 'Estructura recursos y define resultados deseados.',
          ja: 'リソースを構造化し、望ましい成果を定義します。',
          ko: '리소스를 구조화하고 원하는 결과를 정의합니다.',
        },
      },
      {
        title: { en: '3. Prove It', vi: '3. Chứng minh', zh: '3. 证明它', es: '3. Pruébalo', ja: '3. 証明する', ko: '3. 증명' },
        copy: {
          en: 'Execute commitments and attach verifiable proof.',
          vi: 'Thực thi cam kết và đính kèm bằng chứng có thể kiểm chứng.',
          zh: '执行承诺并附上可验证的证明。',
          es: 'Ejecuta compromisos y adjunta pruebas verificables.',
          ja: 'コミットメントを実行し、検証可能な証明を添付します。',
          ko: '약속을 실행하고 검증 가능한 증빙을 첨부합니다.',
        },
      },
      {
        title: { en: '4. Compound It', vi: '4. Tích lũy', zh: '4. 建立信任', es: '4. Compónelo', ja: '4. 蓄積する', ko: '4. 축적' },
        copy: {
          en: 'Build trust that grows with every completed action.',
          vi: 'Xây dựng niềm tin lớn mạnh sau mỗi hành động hoàn tất.',
          zh: '建立随着每次完成的行动而增长的信任。',
          es: 'Construye confianza que crece con cada acción completada.',
          ja: '完了した行動ごとに育つ信頼を築きます。',
          ko: '완료된 모든 행동과 함께 성장하는 신뢰를 구축합니다.',
        },
      },
    ],
  },
  stateTransition: {
    eyebrow: { en: 'State Transition Layer', vi: 'Lớp chuyển đổi trạng thái', zh: '状态转换层', es: 'Capa de Transición de Estado', ja: '状態移行レイヤー', ko: '상태 전환 레이어' },
    title: {
      en: 'From Current Reality to Desired Reality',
      vi: 'Từ thực tại hiện có đến thực tại mong muốn',
      zh: '从当前现实到期望现实',
      es: 'De la realidad actual a la realidad deseada',
      ja: '現在の現実から望ましい現実へ',
      ko: '현재 현실에서 원하는 현실로',
    },
    copy: {
      en: 'Every node in OMDALA has a current state and a desired state. The system continuously plans and executes transitions between them — using real resources, real commitments, and verifiable outcomes.',
      vi: 'Mỗi nút trong OMDALA đều có một trạng thái hiện tại và một trạng thái mong muốn. Hệ thống liên tục lập kế hoạch và thực thi quá trình chuyển đổi giữa chúng bằng tài nguyên thật, cam kết thật và kết quả có thể kiểm chứng.',
      zh: 'OMDALA 中的每个节点都有当前状态与期望状态。系统会持续规划并执行它们之间的转换——依靠真实资源、真实承诺和可验证结果。',
      es: 'Cada nodo en OMDALA tiene un estado actual y un estado deseado. El sistema planifica y ejecuta continuamente las transiciones entre ambos usando recursos reales, compromisos reales y resultados verificables.',
      ja: 'OMDALA の各ノードには現在状態と望ましい状態があります。システムは実在するリソース、実在するコミットメント、検証可能な成果を使って、その間の移行を継続的に計画・実行します。',
      ko: 'OMDALA의 모든 노드는 현재 상태와 원하는 상태를 가집니다. 시스템은 실제 리소스, 실제 약속, 검증 가능한 결과를 사용해 그 사이의 전환을 지속적으로 계획하고 실행합니다.',
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
      zh: '通过承诺进行协调',
      es: 'Coordinación mediante compromisos',
      ja: 'コミットメントによる調整',
      ko: '약속을 통한 조정',
    },
    copy: {
      en: 'Offers and requests are just the surface. At the core of OMDALA is a commitment engine — where nodes define what they will do, under what conditions, and how success is verified.',
      vi: 'Đề nghị và nhu cầu chỉ là lớp bên ngoài. Cốt lõi của OMDALA là một động cơ cam kết, nơi các nút xác định họ sẽ làm gì, dưới điều kiện nào và thành công được xác thực ra sao.',
      zh: '提案与请求只是表层。OMDALA 的核心是一个承诺引擎——节点在其中定义自己要做什么、在什么条件下做，以及如何验证成功。',
      es: 'Las ofertas y solicitudes son solo la superficie. En el núcleo de OMDALA hay un motor de compromisos donde los nodos definen qué harán, bajo qué condiciones y cómo se verifica el éxito.',
      ja: 'オファーとリクエストは表層にすぎません。OMDALA の中核にはコミットメントエンジンがあり、そこでノードは何を、どの条件で行い、どのように成功を検証するかを定義します。',
      ko: '오퍼와 요청은 표면에 불과합니다. OMDALA의 핵심에는 약속 엔진이 있으며, 이곳에서 노드는 무엇을 어떤 조건에서 수행하고 성공을 어떻게 검증할지 정의합니다.',
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
      zh: '信任是建立出来的，不是声称出来的',
      es: 'La confianza se construye, no se declara',
      ja: '信頼は主張するものではなく築くもの',
      ko: '신뢰는 주장하는 것이 아니라 구축하는 것이다',
    },
    copy: {
      en: 'Trust in OMDALA is not based on ratings alone. It is built from verifiable actions, completed commitments, and transparent governance.',
      vi: 'Niềm tin trong OMDALA không chỉ dựa trên đánh giá. Nó được xây từ các hành động có thể kiểm chứng, cam kết đã hoàn tất, và sự quản trị minh bạch.',
      zh: 'OMDALA 中的信任并不只建立在评分之上。它来自可验证的行动、已完成的承诺和透明的治理。',
      es: 'La confianza en OMDALA no se basa solo en calificaciones. Se construye a partir de acciones verificables, compromisos completados y gobernanza transparente.',
      ja: 'OMDALA の信頼は評価だけに基づくものではありません。検証可能な行動、完了したコミットメント、透明なガバナンスから築かれます。',
      ko: 'OMDALA의 신뢰는 평점만으로 형성되지 않습니다. 검증 가능한 행동, 완료된 약속, 투명한 거버넌스에서 구축됩니다.',
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
      zh: '人类治理，机器执行',
      es: 'Gobernado por humanos, operado por máquinas',
      ja: '人が統治し、機械が運用する',
      ko: '사람이 거버넌스하고 기계가 운영한다',
    },
    copy: {
      en: 'All actions — human or AI — must pass through policy and governance. OMDALA ensures that every transition is auditable, explainable, and reversible when needed.',
      vi: 'Mọi hành động — của người hay AI — đều phải đi qua chính sách và quản trị. OMDALA đảm bảo mọi quá trình chuyển đổi đều có thể kiểm toán, giải thích và đảo ngược khi cần.',
      zh: '所有行动——无论来自人还是 AI——都必须经过策略与治理。OMDALA 确保每一次转换都可审计、可解释，并在需要时可逆。',
      es: 'Todas las acciones, humanas o de IA, deben pasar por política y gobernanza. OMDALA garantiza que cada transición sea auditable, explicable y reversible cuando sea necesario.',
      ja: '人間でも AI でも、すべての行動はポリシーとガバナンスを通過しなければなりません。OMDALA はすべての移行が監査可能で、説明可能で、必要に応じて巻き戻せることを保証します。',
      ko: '사람이든 AI든 모든 행동은 정책과 거버넌스를 거쳐야 합니다. OMDALA는 모든 전환이 감사 가능하고 설명 가능하며 필요 시 되돌릴 수 있도록 보장합니다.',
    },
  },
  systemMap: {
    eyebrow: { en: 'System Map', vi: 'Bản đồ hệ thống', zh: '系统地图', es: 'Mapa del sistema', ja: 'システムマップ', ko: '시스템 맵' },
    title: {
      en: 'The OMDALA System',
      vi: 'Hệ thống OMDALA',
      zh: 'OMDALA 系统',
      es: 'El sistema OMDALA',
      ja: 'OMDALA システム',
      ko: 'OMDALA 시스템',
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
      zh: '你可以做什么',
      es: 'Lo que puedes hacer',
      ja: 'できること',
      ko: '할 수 있는 것',
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
      zh: '与 OMDALA 一起构建你的现实',
      es: 'Construye tu realidad con OMDALA',
      ja: 'OMDALA とともに現実を築く',
      ko: 'OMDALA와 함께 당신의 현실을 구축하세요',
    },
    primary: { en: 'Start Now', vi: 'Bắt đầu ngay', zh: '现在开始', es: 'Empezar ahora', ja: '今すぐ始める', ko: '지금 시작하기' },
    secondary: { en: 'Talk to Us', vi: 'Trò chuyện với chúng tôi', zh: '联系我们', es: 'Habla con nosotros', ja: 'お問い合わせ', ko: '문의하기' },
  }
} as const

export const definitionContent = {
  hero: {
    eyebrow: { en: 'Definition', vi: 'Định nghĩa', zh: '定义', es: 'Definición', ja: '定義', ko: '정의' },
    title: {
      en: 'OMDALA is an independent platform for coordinated value.',
      vi: 'OMDALA là nền tảng độc lập để điều phối giá trị.',
      zh: 'OMDALA 是面向协调价值的独立平台。',
      es: 'OMDALA es una plataforma independiente para el valor coordinado.',
      ja: 'OMDALA は調整された価値のための独立プラットフォームです。',
      ko: 'OMDALA는 조정된 가치를 위한 독립 플랫폼입니다.',
    },
    lead: {
      en: 'It is not a tourism site, not a city-brand wrapper, and not a decorative AI layer. It is the operating layer that makes identity, resources, trust, and action work together.',
      vi: 'Đây không phải trang du lịch, không phải lớp bọc cho một thương hiệu địa phương, và cũng không phải lớp AI trang trí. Đây là lớp vận hành giúp định danh, tài nguyên, niềm tin và hành động phối hợp với nhau.',
      zh: '它不是旅游网站，不是城市品牌外壳，也不是装饰性的 AI 层。它是让身份、资源、信任与行动协同运作的操作层。',
      es: 'No es un sitio de turismo, ni una envoltura de marca urbana, ni una capa decorativa de IA. Es la capa operativa que hace trabajar juntas la identidad, los recursos, la confianza y la acción.',
      ja: 'これは旅行サイトでも、都市ブランドのラッパーでも、装飾的な AI レイヤーでもありません。身元、資源、信頼、行動を連携させるオペレーティングレイヤーです。',
      ko: '이것은 여행 사이트도, 도시 브랜드용 래퍼도, 장식용 AI 레이어도 아닙니다. 정체성, 자원, 신뢰, 행동이 함께 작동하도록 만드는 운영 레이어입니다.',
    },
  },
  cards: [
    {
      title: { en: 'What it is', vi: 'Đây là gì', zh: '它是什么', es: 'Qué es', ja: 'それは何か', ko: '무엇인가' },
      copy: {
        en: 'A platform for coordinating people, places, organizations, resources, and outcomes.',
        vi: 'Một nền tảng điều phối con người, địa điểm, tổ chức, tài nguyên và kết quả.',
        zh: '一个用于协调人、地点、组织、资源和结果的平台。',
        es: 'Una plataforma para coordinar personas, lugares, organizaciones, recursos y resultados.',
        ja: '人、場所、組織、資源、成果を調整するためのプラットフォームです。',
        ko: '사람, 장소, 조직, 리소스, 결과를 조정하는 플랫폼입니다.',
      },
    },
    {
      title: { en: 'What it is not', vi: 'Không phải gì', zh: '它不是什么', es: 'Qué no es', ja: 'それではないもの', ko: '무엇이 아닌가' },
      copy: {
        en: 'A noisy feed, a thin directory, a one-feature app, a city-tourism brand, or a derivative of another platform.',
        vi: 'Không phải newsfeed ồn ào, danh bạ mỏng, ứng dụng một tính năng, thương hiệu du lịch địa phương hay sản phẩm dẫn xuất từ nền tảng khác.',
        zh: '它不是嘈杂的信息流、单薄目录、单功能应用、城市旅游品牌，或其他平台的衍生产品。',
        es: 'No es un feed ruidoso, un directorio superficial, una app de una sola función, una marca turística urbana ni un derivado de otra plataforma.',
        ja: '騒がしいフィードでも、薄いディレクトリでも、単機能アプリでも、都市観光ブランドでも、他プラットフォームの派生物でもありません。',
        ko: '시끄러운 피드도, 얇은 디렉터리도, 단일 기능 앱도, 도시 관광 브랜드도, 다른 플랫폼의 파생물도 아닙니다.',
      },
    },
    {
      title: { en: 'Where it sits', vi: 'Vị trí của nó', zh: '它位于何处', es: 'Dónde se sitúa', ja: 'どこに位置するか', ko: '어디에 위치하는가' },
      copy: {
        en: 'As a standalone product: web, app, API, docs, trust, and admin surfaces all flow from its own platform boundary.',
        vi: 'Như một sản phẩm độc lập: các lớp web, app, API, docs, trust và admin đều xuất phát từ ranh giới nền tảng riêng của nó.',
        zh: '作为独立产品：web、app、API、docs、trust 和 admin 等界面都来自它自己的平台边界。',
        es: 'Como producto independiente: las superficies web, app, API, docs, trust y admin parten de su propio límite de plataforma.',
        ja: '独立した製品として、web、app、API、docs、trust、admin の各サーフェスは固有のプラットフォーム境界から展開されます。',
        ko: '독립 제품으로서 web, app, API, docs, trust, admin 표면은 모두 자체 플랫폼 경계에서 확장됩니다.',
      },
    },
  ],
  layers: {
    eyebrow: { en: 'Core Layers', vi: 'Các lớp cốt lõi', zh: '核心层', es: 'Capas centrales', ja: 'コアレイヤー', ko: '핵심 레이어' },
    title: {
      en: 'The platform is designed as five layers working together',
      vi: 'Nền tảng được thiết kế gồm 5 lớp phối hợp',
      zh: '该平台被设计为五个协同工作的层次',
      es: 'La plataforma está diseñada como cinco capas trabajando juntas',
      ja: 'このプラットフォームは連携して動く 5 つの層として設計されています',
      ko: '이 플랫폼은 함께 작동하는 다섯 개의 레이어로 설계되었습니다',
    },
    items: [
      { en: 'Identity: nodes, roles, ownership, visibility, and trust baseline.', vi: 'Định danh: nút, vai trò, quyền sở hữu, mức hiển thị và nền niềm tin.', zh: '身份层：节点、角色、归属、可见性与信任基线。', es: 'Identidad: nodos, roles, propiedad, visibilidad y línea base de confianza.', ja: '身元レイヤー: ノード、役割、所有権、可視性、信頼ベースライン。', ko: '신원 레이어: 노드, 역할, 소유권, 가시성, 신뢰 기준선.' },
      { en: 'Resources: time, space, skill, knowledge, capacity, and underused assets.', vi: 'Tài nguyên: thời gian, không gian, kỹ năng, tri thức, năng lực và tài sản nhàn rỗi.', zh: '资源层：时间、空间、技能、知识、能力与闲置资产。', es: 'Recursos: tiempo, espacio, habilidades, conocimiento, capacidad y activos infrautilizados.', ja: '資源レイヤー: 時間、空間、スキル、知識、能力、遊休資産。', ko: '자원 레이어: 시간, 공간, 기술, 지식, 역량, 유휴 자산.' },
      { en: 'Coordination: offers, requests, matching, messaging, bookings, and tasks.', vi: 'Điều phối: đề nghị, nhu cầu, ghép nối, nhắn tin, đặt lịch và tác vụ.', zh: '协调层：提案、请求、匹配、消息、预订与任务。', es: 'Coordinación: ofertas, solicitudes, emparejamiento, mensajería, reservas y tareas.', ja: '調整レイヤー: オファー、リクエスト、マッチング、メッセージ、予約、タスク。', ko: '조정 레이어: 오퍼, 요청, 매칭, 메시징, 예약, 작업.' },
      { en: 'Trust: verification, proof, behavior, governance, and explainable reputation.', vi: 'Niềm tin: xác thực, bằng chứng, hành vi, quản trị và uy tín có thể giải thích.', zh: '信任层：验证、证明、行为、治理与可解释声誉。', es: 'Confianza: verificación, prueba, comportamiento, gobernanza y reputación explicable.', ja: '信頼レイヤー: 検証、証明、行動、ガバナンス、説明可能な評判。', ko: '신뢰 레이어: 검증, 증빙, 행동, 거버넌스, 설명 가능한 평판.' },
      { en: 'Intelligence: AI planning, orchestration, prioritization, and action support.', vi: 'Trí tuệ: lập kế hoạch AI, điều phối, ưu tiên và hỗ trợ hành động.', zh: '智能层：AI 规划、编排、优先级与行动支持。', es: 'Inteligencia: planificación con IA, orquestación, priorización y apoyo a la acción.', ja: '知能レイヤー: AI 計画、オーケストレーション、優先順位付け、行動支援。', ko: '지능 레이어: AI 계획, 오케스트레이션, 우선순위화, 행동 지원.' },
    ],
  },
} as const

export const processContent = {
  hero: {
    eyebrow: { en: 'System Logic', vi: 'Logic hệ thống', zh: '系统逻辑', es: 'Lógica del sistema', ja: 'システムロジック', ko: '시스템 로직' },
    title: {
      en: 'OMDALA works by turning hidden capacity into structured action.',
      vi: 'OMDALA vận hành bằng cách biến năng lực ẩn thành hành động có cấu trúc.',
      zh: 'OMDALA 通过将隐藏能力转化为结构化行动来运作。',
      es: 'OMDALA funciona convirtiendo capacidad oculta en acción estructurada.',
      ja: 'OMDALA は隠れた能力を構造化された行動へ変換することで機能します。',
      ko: 'OMDALA는 숨겨진 역량을 구조화된 행동으로 바꾸며 작동합니다.',
    },
    lead: {
      en: 'The platform is built around one compounding loop: see what exists, match the right fit, move to action, store proof, and improve future outcomes.',
      vi: 'Nền tảng xoay quanh một vòng lặp tích lũy: thấy rõ hiện trạng, ghép đúng đối tượng, chuyển sang hành động, lưu bằng chứng và cải thiện kết quả tương lai.',
      zh: '这个平台围绕一个复利循环构建：看见已存在的东西，匹配正确对象，转入行动，保存证明，并改善未来结果。',
      es: 'La plataforma está construida alrededor de un ciclo compuesto: ver lo que existe, encontrar el ajuste correcto, pasar a la acción, guardar pruebas y mejorar los resultados futuros.',
      ja: 'このプラットフォームは一つの複利ループを中心に構築されています。今あるものを見える化し、正しい適合を見つけ、行動に移し、証明を蓄積し、将来の成果を改善します。',
      ko: '이 플랫폼은 하나의 복합 루프를 중심으로 구축됩니다. 존재하는 것을 보고, 올바른 적합을 찾고, 행동으로 옮기고, 증빙을 저장하며, 미래 결과를 개선합니다.',
    },
  },
  steps: [
    {
      title: { en: '1. Map the node', vi: '1. Lập bản đồ nút', zh: '1. 绘制节点地图', es: '1. Mapear el nodo', ja: '1. ノードをマッピングする', ko: '1. 노드를 매핑한다' },
      copy: { en: 'Capture identity, goals, roles, availability, assets, and current trust state.', vi: 'Ghi nhận định danh, mục tiêu, vai trò, mức sẵn sàng, tài sản và trạng thái niềm tin hiện tại.', zh: '捕捉身份、目标、角色、可用性、资产以及当前信任状态。', es: 'Captura identidad, objetivos, roles, disponibilidad, activos y el estado actual de confianza.', ja: 'アイデンティティ、目標、役割、可用性、資産、現在の信頼状態を記録します。', ko: '정체성, 목표, 역할, 가용성, 자산, 현재 신뢰 상태를 포착합니다.' },
    },
    {
      title: { en: '2. Normalize the resource', vi: '2. Chuẩn hóa tài nguyên', zh: '2. 标准化资源', es: '2. Normalizar el recurso', ja: '2. リソースを正規化する', ko: '2. 리소스를 정규화한다' },
      copy: { en: 'Turn loose information into resource objects, offers, requests, and operational states.', vi: 'Biến thông tin rời rạc thành đối tượng tài nguyên, đề nghị, nhu cầu và trạng thái vận hành.', zh: '将松散信息转化为资源对象、提案、请求和运行状态。', es: 'Convierte información dispersa en objetos de recurso, ofertas, solicitudes y estados operativos.', ja: '散在した情報をリソースオブジェクト、オファー、リクエスト、運用状態へ変換します。', ko: '흩어진 정보를 리소스 객체, 오퍼, 요청, 운영 상태로 전환합니다.' },
    },
    {
      title: { en: '3. Score the fit', vi: '3. Chấm điểm phù hợp', zh: '3. 评估匹配度', es: '3. Puntuar el ajuste', ja: '3. 適合度をスコア化する', ko: '3. 적합도를 점수화한다' },
      copy: { en: 'Use matching signals such as trust, timing, relevance, locality, capacity, and intent.', vi: 'Dùng tín hiệu ghép nối như niềm tin, thời điểm, mức liên quan, địa phương, năng lực và ý định.', zh: '使用信任、时机、相关性、地域性、容量和意图等匹配信号。', es: 'Usa señales de matching como confianza, timing, relevancia, localidad, capacidad e intención.', ja: '信頼、タイミング、関連性、地域性、容量、意図などのマッチングシグナルを用います。', ko: '신뢰, 타이밍, 관련성, 지역성, 수용력, 의도 같은 매칭 신호를 사용합니다.' },
    },
    {
      title: { en: '4. Convert to execution', vi: '4. Chuyển thành thực thi', zh: '4. 转入执行', es: '4. Convertir en ejecución', ja: '4. 実行へ変換する', ko: '4. 실행으로 전환한다' },
      copy: { en: 'Draft messages, create tasks, open bookings, and guide follow-through with AI assistance.', vi: 'Soạn nhắn tin, tạo tác vụ, mở đặt lịch và dẫn dắt theo đuổi với hỗ trợ AI.', zh: '借助 AI 草拟消息、创建任务、开启预订并引导后续执行。', es: 'Redacta mensajes, crea tareas, abre reservas y guía el seguimiento con ayuda de IA.', ja: 'AI 支援により、メッセージ草案、タスク作成、予約開始、フォロー実行を進めます。', ko: 'AI 지원으로 메시지를 초안하고, 작업을 만들고, 예약을 열고, 후속 실행을 이끕니다.' },
    },
    {
      title: { en: '5. Record proof', vi: '5. Ghi nhận bằng chứng', zh: '5. 记录证明', es: '5. Registrar pruebas', ja: '5. 証明を記録する', ko: '5. 증빙을 기록한다' },
      copy: { en: 'Attach receipts, confirmations, outputs, endorsements, and verification artifacts.', vi: 'Gắn biên nhận, xác nhận, đầu ra, bảo chứng và tạo tác xác thực.', zh: '附加收据、确认、输出、背书和验证凭证。', es: 'Adjunta recibos, confirmaciones, outputs, respaldos y artefactos de verificación.', ja: '領収書、確認、成果物、エンドースメント、検証アーティファクトを添付します。', ko: '영수증, 확인, 산출물, 보증, 검증 아티팩트를 첨부합니다.' },
    },
    {
      title: { en: '6. Compound trust', vi: '6. Tích lũy niềm tin', zh: '6. 累积信任', es: '6. Acumular confianza', ja: '6. 信頼を積み上げる', ko: '6. 신뢰를 축적한다' },
      copy: { en: 'Use outcomes to increase discoverability, reduce risk, and improve future opportunity quality.', vi: 'Dùng kết quả để tăng khả năng khám phá, giảm rủi ro và nâng chất lượng cơ hội tương lai.', zh: '利用结果提升可发现性、降低风险，并提高未来机会质量。', es: 'Usa los resultados para aumentar la descubribilidad, reducir el riesgo y mejorar la calidad de oportunidades futuras.', ja: '成果を使って発見性を高め、リスクを減らし、将来の機会の質を向上させます。', ko: '결과를 활용해 발견 가능성을 높이고, 위험을 줄이며, 미래 기회의 질을 향상시킵니다.' },
    },
  ],
} as const

export const audiencePages = {
  experts: {
    hero: {
      eyebrow: { en: 'For Experts', vi: 'Dành cho chuyên gia', zh: '面向专家', es: 'Para expertos', ja: '専門家向け', ko: '전문가용' },
      title: { en: 'Turn expertise into structured, trusted opportunity.', vi: 'Biến chuyên môn thành cơ hội có cấu trúc và đáng tin.', zh: '把专业能力转化为结构化且可信的机会。', es: 'Convierte la experiencia en oportunidades estructuradas y confiables.', ja: '専門性を構造化され信頼できる機会へ変える。', ko: '전문성을 구조화되고 신뢰할 수 있는 기회로 전환하세요.' },
      lead: {
        en: 'OMDALA helps specialists, advisors, creators, and operators package time, knowledge, and credibility into offers, requests, and repeatable trust-backed workflows.',
        vi: 'OMDALA giúp chuyên gia, cố vấn, nhà sáng tạo và người vận hành đóng gói thời gian, tri thức và uy tín thành đề nghị, nhu cầu và luồng công việc lặp lại dựa trên niềm tin.',
        zh: 'OMDALA 帮助专家、顾问、创作者和运营者把时间、知识与可信度打包成提案、请求和可重复的信任驱动工作流。',
        es: 'OMDALA ayuda a especialistas, asesores, creadores y operadores a empaquetar tiempo, conocimiento y credibilidad en ofertas, solicitudes y flujos repetibles respaldados por confianza.',
        ja: 'OMDALA は専門家、アドバイザー、クリエイター、オペレーターが時間、知識、信頼性をオファー、リクエスト、再現可能な信頼ベースのワークフローに変換するのを支援します。',
        ko: 'OMDALA는 전문가, 어드바이저, 크리에이터, 운영자가 시간, 지식, 신뢰도를 오퍼, 요청, 반복 가능한 신뢰 기반 워크플로로 패키징할 수 있게 돕습니다.',
      },
    },
    cards: [
      {
        title: { en: 'Package your value', vi: 'Đóng gói giá trị của bạn', zh: '打包你的价值', es: 'Empaqueta tu valor', ja: '価値をパッケージ化する', ko: '당신의 가치를 패키징하기' },
        copy: { en: 'Convert expertise, availability, and goals into clear offers and operational objects.', vi: 'Chuyển chuyên môn, mức sẵn sàng và mục tiêu thành đề nghị rõ ràng và đối tượng vận hành.', zh: '把专业能力、可用性和目标转换为清晰的提案与运营对象。', es: 'Convierte experiencia, disponibilidad y objetivos en ofertas claras y objetos operativos.', ja: '専門性、可用性、目標を明確なオファーと運用オブジェクトへ変換します。', ko: '전문성, 가용성, 목표를 명확한 오퍼와 운영 객체로 전환합니다.' },
      },
      {
        title: { en: 'Improve signal quality', vi: 'Nâng chất lượng tín hiệu', zh: '提升信号质量', es: 'Mejora la calidad de la señal', ja: 'シグナル品質を高める', ko: '신호 품질 향상' },
        copy: { en: 'Use proof, verification, and completion history to make discovery more trustworthy.', vi: 'Dùng bằng chứng, xác thực và lịch sử hoàn thành để tăng độ tin cậy khi được khám phá.', zh: '利用证明、验证与完成历史，让被发现的过程更可信。', es: 'Usa pruebas, verificación e historial de cumplimiento para que el descubrimiento sea más confiable.', ja: '証明、検証、完了履歴を用いて発見されるシグナルの信頼性を高めます。', ko: '증빙, 검증, 완료 이력을 사용해 발견 신호를 더 신뢰할 수 있게 만듭니다.' },
      },
      {
        title: { en: 'Act faster', vi: 'Hành động nhanh hơn', zh: '更快行动', es: 'Actúa más rápido', ja: 'より速く動く', ko: '더 빠르게 행동하기' },
        copy: { en: 'Move from idea to outreach, booking, pricing, and task lists with AI support.', vi: 'Đi từ ý tưởng đến tiếp cận, đặt lịch, định giá và danh sách tác vụ với hỗ trợ AI.', zh: '借助 AI，从想法快速推进到触达、预订、定价和任务列表。', es: 'Pasa de la idea al outreach, booking, pricing y listas de tareas con apoyo de IA.', ja: 'AI 支援により、アイデアからアウトリーチ、予約、価格設定、タスクリストまで素早く進めます。', ko: 'AI 지원으로 아이디어에서 아웃리치, 예약, 가격 책정, 작업 목록까지 빠르게 이동합니다.' },
      },
    ],
  },
  hosts: {
    hero: {
      eyebrow: { en: 'For Hosts', vi: 'Dành cho đơn vị đón tiếp', zh: '面向主理人', es: 'Para hosts', ja: 'ホスト向け', ko: '호스트용' },
      title: { en: 'Turn place capacity into higher-quality utilization.', vi: 'Biến năng lực địa điểm thành mức khai thác chất lượng cao hơn.', zh: '把空间容量转化为更高质量的利用率。', es: 'Convierte la capacidad del lugar en una utilización de mayor calidad.', ja: '場所のキャパシティをより高品質な稼働へ変える。', ko: '공간 수용력을 더 높은 품질의 활용도로 전환하세요.' },
      lead: {
        en: 'Hosts need more than listings. They need fit, timing, trust, and operational follow-through. OMDALA is designed to structure that full loop.',
        vi: 'Đơn vị đón tiếp cần nhiều hơn một danh sách hiển thị. Họ cần mức độ phù hợp, thời điểm, niềm tin và khả năng theo sát vận hành. OMDALA được thiết kế để cấu trúc trọn vẹn vòng đó.',
        zh: '主理人需要的不只是列表。他们需要匹配度、时机、信任与运营跟进。OMDALA 就是为结构化这整条闭环而设计的。',
        es: 'Los hosts necesitan más que listados. Necesitan ajuste, timing, confianza y seguimiento operativo. OMDALA está diseñado para estructurar ese ciclo completo.',
        ja: 'ホストに必要なのは掲載一覧だけではありません。適合度、タイミング、信頼、運用フォローが必要です。OMDALA はその全ループを構造化するために設計されています。',
        ko: '호스트에게 필요한 것은 단순한 listing이 아닙니다. 적합성, 타이밍, 신뢰, 운영 후속 조치가 필요합니다. OMDALA는 그 전체 루프를 구조화하도록 설계되었습니다.',
      },
    },
    items: [
      { en: 'Model spaces, availability, and place rules as structured resources.', vi: 'Mô hình hóa không gian, mức sẵn sàng và quy tắc địa điểm thành tài nguyên có cấu trúc.', zh: '把空间、可用性和场地规则建模为结构化资源。', es: 'Modela espacios, disponibilidad y reglas del lugar como recursos estructurados.', ja: '空間、可用性、場所のルールを構造化リソースとしてモデル化します。', ko: '공간, 가용성, 장소 규칙을 구조화된 리소스로 모델링합니다.' },
      { en: 'Match against trust level, purpose, timing, and expected operational fit.', vi: 'Ghép nối theo mức niềm tin, mục tiêu, thời điểm và mức phù hợp vận hành kỳ vọng.', zh: '根据信任等级、目的、时机和预期运营适配度进行匹配。', es: 'Haz matching según nivel de confianza, propósito, timing y ajuste operativo esperado.', ja: '信頼レベル、目的、タイミング、期待される運用適合度に基づいてマッチングします。', ko: '신뢰 수준, 목적, 타이밍, 예상 운영 적합성에 따라 매칭합니다.' },
      { en: 'Use proofs and historical outcomes to strengthen future bookings.', vi: 'Dùng bằng chứng và kết quả lịch sử để củng cố các lần đặt lịch tương lai.', zh: '利用证明与历史结果来强化未来的预订质量。', es: 'Usa pruebas y resultados históricos para fortalecer futuras reservas.', ja: '証明と過去の成果を使って今後の予約を強化します。', ko: '증빙과 과거 결과를 활용해 향후 예약을 강화합니다.' },
      { en: 'Move from inquiry to action with messaging, tasks, and booking states.', vi: 'Đi từ yêu cầu đến hành động bằng nhắn tin, tác vụ và trạng thái đặt lịch.', zh: '通过消息、任务和预订状态，把咨询推进到行动。', es: 'Pasa de la consulta a la acción con mensajería, tareas y estados de reserva.', ja: 'メッセージ、タスク、予約状態を使って問い合わせから行動へ進めます。', ko: '메시징, 작업, 예약 상태를 통해 문의에서 실행으로 전환합니다.' },
    ],
  },
  communities: {
    hero: {
      eyebrow: { en: 'For Communities', vi: 'Dành cho cộng đồng', zh: '面向社区', es: 'Para comunidades', ja: 'コミュニティ向け', ko: '커뮤니티용' },
      title: { en: 'Run groups, assets, and governance with more clarity.', vi: 'Vận hành nhóm, tài sản và quản trị rõ ràng hơn.', zh: '更清晰地运营群体、资产与治理。', es: 'Gestiona grupos, activos y gobernanza con más claridad.', ja: 'グループ、資産、ガバナンスをより明確に運営する。', ko: '그룹, 자산, 거버넌스를 더 명확하게 운영하세요.' },
      lead: {
        en: 'Communities become stronger when shared resources, roles, proof, and coordination live in one calm system instead of fragmented threads and manual workarounds.',
        vi: 'Cộng đồng mạnh hơn khi tài nguyên chung, vai trò, bằng chứng và điều phối nằm trong một hệ thống thống nhất thay vì các luồng rời rạc và xử lý thủ công.',
        zh: '当共享资源、角色、证明和协调都存在于一个平静统一的系统中，而不是分裂的线程和手工补丁里，社区就会更强。',
        es: 'Las comunidades se fortalecen cuando recursos compartidos, roles, pruebas y coordinación viven en un sistema sereno en lugar de hilos fragmentados y parches manuales.',
        ja: '共有リソース、役割、証明、調整が分断されたスレッドや手作業の回避策ではなく、一つの落ち着いたシステムに収まるとき、コミュニティはより強くなります。',
        ko: '공유 리소스, 역할, 증빙, 조정이 분절된 스레드와 수작업이 아니라 하나의 차분한 시스템에 있을 때 커뮤니티는 더 강해집니다.',
      },
    },
    cards: [
      { title: { en: 'Shared resources', vi: 'Tài nguyên dùng chung', zh: '共享资源', es: 'Recursos compartidos', ja: '共有リソース', ko: '공유 리소스' }, copy: { en: 'Track assets, availability, events, and responsibilities across the group.', vi: 'Theo dõi tài sản, mức sẵn sàng, sự kiện và trách nhiệm trong toàn nhóm.', zh: '跟踪整个群体中的资产、可用性、事件和责任。', es: 'Haz seguimiento de activos, disponibilidad, eventos y responsabilidades en todo el grupo.', ja: 'グループ全体の資産、可用性、イベント、責任を追跡します。', ko: '그룹 전체의 자산, 가용성, 이벤트, 책임을 추적합니다.' } },
      { title: { en: 'Member trust', vi: 'Niềm tin thành viên', zh: '成员信任', es: 'Confianza de miembros', ja: 'メンバー信頼', ko: '구성원 신뢰' }, copy: { en: 'Build visible reliability through proof, participation, role history, and governance logs.', vi: 'Xây dựng độ tin cậy nhìn thấy được qua bằng chứng, mức tham gia, lịch sử vai trò và nhật ký quản trị.', zh: '通过证明、参与度、角色历史和治理日志建立可见的可靠性。', es: 'Construye fiabilidad visible mediante pruebas, participación, historial de roles y logs de gobernanza.', ja: '証明、参加度、役割履歴、ガバナンスログによって可視的な信頼性を築きます。', ko: '증빙, 참여도, 역할 이력, 거버넌스 로그를 통해 가시적인 신뢰성을 구축합니다.' } },
      { title: { en: 'Operational memory', vi: 'Bộ nhớ vận hành', zh: '运营记忆', es: 'Memoria operativa', ja: '運用メモリ', ko: '운영 메모리' }, copy: { en: 'Keep community actions auditable so valuable knowledge does not disappear into chat.', vi: 'Giữ hành động cộng đồng có thể kiểm toán để tri thức giá trị không biến mất trong luồng chat.', zh: '让社区行动保持可审计，以免有价值的知识消失在聊天流中。', es: 'Mantén las acciones de la comunidad auditables para que el conocimiento valioso no desaparezca en el chat.', ja: 'コミュニティの行動を監査可能に保ち、価値ある知識がチャットの中に消えないようにします。', ko: '커뮤니티 행동을 감사 가능하게 유지해 가치 있는 지식이 채팅 속으로 사라지지 않게 합니다.' } },
    ],
  },
} as const

export const trustContent = {
  hero: {
    eyebrow: { en: 'Trust by Design', vi: 'Niềm tin theo thiết kế', zh: '以设计构建信任', es: 'Confianza por diseño', ja: '設計による信頼', ko: '설계된 신뢰' },
    title: { en: 'Trust is infrastructure, not decoration.', vi: 'Niềm tin là hạ tầng, không phải trang trí.', zh: '信任是基础设施，不是装饰。', es: 'La confianza es infraestructura, no decoración.', ja: '信頼は装飾ではなくインフラです。', ko: '신뢰는 장식이 아니라 인프라입니다.' },
    lead: {
      en: 'OMDALA does not reduce trust to stars and vibes. It treats trust as a system built from evidence, behavior, completion, governance, and explainable visibility rules.',
      vi: 'OMDALA không rút gọn niềm tin thành sao đánh giá cảm tính. Hệ thống xem niềm tin là cấu trúc được xây từ bằng chứng, hành vi, mức hoàn thành, quản trị và quy tắc hiển thị có thể giải thích.',
      zh: 'OMDALA 不会把信任简化为星级和感觉。它把信任视为一个由证据、行为、完成度、治理以及可解释展示规则构成的系统。',
      es: 'OMDALA no reduce la confianza a estrellas y sensaciones. La trata como un sistema construido con evidencia, comportamiento, cumplimiento, gobernanza y reglas de visibilidad explicables.',
      ja: 'OMDALA は信頼を星評価や雰囲気に還元しません。信頼を、証拠、行動、完了度、ガバナンス、説明可能な可視化ルールから構成されるシステムとして扱います。',
      ko: 'OMDALA는 신뢰를 별점과 감각으로 축소하지 않습니다. 신뢰를 증거, 행동, 완료도, 거버넌스, 설명 가능한 가시성 규칙으로 구축된 시스템으로 다룹니다.',
    },
  },
  cards: [
    { title: { en: 'Verification', vi: 'Xác thực', zh: '验证', es: 'Verificación', ja: '検証', ko: '검증' }, copy: { en: 'Identity, ownership, payment, affiliation, and other factual checks where appropriate.', vi: 'Định danh, quyền sở hữu, thanh toán, liên kết và các kiểm tra sự thật khi phù hợp.', zh: '在适用情况下，对身份、所有权、支付、关联关系及其他事实进行核验。', es: 'Identidad, propiedad, pago, afiliación y otras comprobaciones fácticas cuando corresponda.', ja: '必要に応じて、身元、所有権、支払い、所属などの事実確認を行います。', ko: '필요한 경우 신원, 소유권, 결제, 소속 등 사실 기반 검증을 수행합니다.' } },
    { title: { en: 'Proof', vi: 'Bằng chứng', zh: '证明', es: 'Prueba', ja: '証明', ko: '증빙' }, copy: { en: 'Receipts, confirmations, outputs, attendance, delivery, and completion evidence.', vi: 'Biên nhận, xác nhận, đầu ra, điểm danh, bàn giao và bằng chứng hoàn thành.', zh: '收据、确认、输出、出席、交付与完成证据。', es: 'Recibos, confirmaciones, outputs, asistencia, entrega y evidencia de cumplimiento.', ja: '領収書、確認、成果物、出席、納品、完了証拠。', ko: '영수증, 확인, 산출물, 출석, 전달, 완료 증거.' } },
    { title: { en: 'Behavior', vi: 'Hành vi', zh: '行为', es: 'Comportamiento', ja: '行動', ko: '행동' }, copy: { en: 'Response quality, reliability, cancellation patterns, dispute history, and follow-through.', vi: 'Chất lượng phản hồi, độ tin cậy, mẫu hủy, lịch sử tranh chấp và khả năng theo đuổi.', zh: '响应质量、可靠性、取消模式、争议历史和后续执行力。', es: 'Calidad de respuesta, fiabilidad, patrones de cancelación, historial de disputas y seguimiento.', ja: '応答品質、信頼性、キャンセル傾向、紛争履歴、フォロースルー。', ko: '응답 품질, 신뢰성, 취소 패턴, 분쟁 이력, 후속 이행력.' } },
    { title: { en: 'Governance', vi: 'Quản trị', zh: '治理', es: 'Gobernanza', ja: 'ガバナンス', ko: '거버넌스' }, copy: { en: 'Warnings, overrides, moderation actions, and audit trails for sensitive decisions.', vi: 'Cảnh báo, ghi đè, hành động kiểm duyệt và dấu vết kiểm toán cho quyết định nhạy cảm.', zh: '针对敏感决策的警告、覆盖、审核动作与审计轨迹。', es: 'Advertencias, overrides, acciones de moderación y trazas de auditoría para decisiones sensibles.', ja: 'センシティブな判断に対する警告、オーバーライド、モデレーションアクション、監査証跡。', ko: '민감한 결정에 대한 경고, 오버라이드, 모더레이션 액션, 감사 추적.' } },
  ],
} as const

export const visionContent = {
  hero: {
    eyebrow: { en: 'Long-Term Vision', vi: 'Tầm nhìn dài hạn', zh: '长期愿景', es: 'Visión a largo plazo', ja: '長期ビジョン', ko: '장기 비전' },
    title: {
      en: 'Design narrow enough to launch, strong enough to matter for decades.',
      vi: 'Thiết kế đủ gọn để ra mắt, đủ vững để có ý nghĩa trong nhiều thập kỷ.',
      zh: '设计要足够聚焦以便启动，也要足够强大以在数十年后仍有价值。',
      es: 'Diseña lo bastante enfocado para lanzar y lo bastante fuerte para importar durante décadas.',
      ja: 'ローンチできるほど絞り込みつつ、数十年にわたり意味を持つほど強く設計する。',
      ko: '출시할 만큼 좁게, 수십 년 동안 의미를 가질 만큼 강하게 설계하세요.',
    },
    lead: {
      en: 'OMDALA should start with sharp operational usefulness, but the architecture must be able to grow into a durable layer for trust-backed human coordination across many domains.',
      vi: 'OMDALA nên bắt đầu bằng tính hữu dụng vận hành sắc nét, nhưng kiến trúc phải đủ khả năng phát triển thành lớp điều phối con người bền vững dựa trên niềm tin qua nhiều lĩnh vực.',
      zh: 'OMDALA 应从强烈的运营实用性开始，但架构必须能够成长为跨多个领域、以信任为支撑的人类协调耐久层。',
      es: 'OMDALA debe empezar con una utilidad operativa aguda, pero la arquitectura debe poder crecer hasta convertirse en una capa duradera de coordinación humana respaldada por confianza en muchos dominios.',
      ja: 'OMDALA は鋭い運用上の有用性から始まるべきですが、アーキテクチャは多領域にわたる信頼ベースの人間調整レイヤーへ成長できなければなりません。',
      ko: 'OMDALA는 선명한 운영 효용성에서 시작해야 하지만, 아키텍처는 여러 도메인에서 신뢰 기반 인간 조정의 지속 가능한 레이어로 성장할 수 있어야 합니다.',
    },
  },
  horizons: [
    { title: { en: '10-year horizon', vi: 'Tầm nhìn 10 năm', zh: '10 年视野', es: 'Horizonte de 10 años', ja: '10年の視野', ko: '10년 지평' }, copy: { en: 'Become indispensable for experts, hosts, communities, and small business nodes.', vi: 'Trở thành hạ tầng không thể thiếu cho chuyên gia, đơn vị đón tiếp, cộng đồng và các nút doanh nghiệp nhỏ.', zh: '成为专家、主理人、社区和小企业节点不可或缺的基础设施。', es: 'Volverse indispensable para expertos, hosts, comunidades y nodos de pequeñas empresas.', ja: '専門家、ホスト、コミュニティ、小規模ビジネスノードにとって不可欠な基盤になる。', ko: '전문가, 호스트, 커뮤니티, 소규모 비즈니스 노드에 없어서는 안 될 인프라가 됩니다.' } },
    { title: { en: '25-year horizon', vi: 'Tầm nhìn 25 năm', zh: '25 年视野', es: 'Horizonte de 25 años', ja: '25年の視野', ko: '25년 지평' }, copy: { en: 'Operate as shared infrastructure for distributed networks, assets, and local economies.', vi: 'Vận hành như hạ tầng chung cho mạng lưới phân tán, tài sản và kinh tế địa phương.', zh: '作为分布式网络、资产和地方经济的共享基础设施运行。', es: 'Operar como infraestructura compartida para redes distribuidas, activos y economías locales.', ja: '分散ネットワーク、資産、地域経済のための共有インフラとして機能する。', ko: '분산 네트워크, 자산, 지역 경제를 위한 공유 인프라로 운영됩니다.' } },
    { title: { en: '100-year horizon', vi: 'Tầm nhìn 100 năm', zh: '100 年视野', es: 'Horizonte de 100 años', ja: '100年の視野', ko: '100년 지평' }, copy: { en: 'Remain valuable because trust, coordination, proof, and resource activation are durable needs.', vi: 'Duy trì giá trị vì niềm tin, điều phối, bằng chứng và kích hoạt tài nguyên là nhu cầu bền vững.', zh: '持续保持价值，因为信任、协调、证明与资源激活都是长期存在的需求。', es: 'Seguir siendo valioso porque la confianza, la coordinación, la prueba y la activación de recursos son necesidades duraderas.', ja: '信頼、調整、証明、資源活性化は持続的なニーズであるため、価値を保ち続ける。', ko: '신뢰, 조정, 증빙, 자원 활성화는 지속적인 수요이기 때문에 장기적으로 가치가 유지됩니다.' } },
  ],
} as const

export const faqContent = {
  hero: {
    title: {
      en: 'Clear answers before the build expands.',
      vi: 'Trả lời rõ ràng trước khi hệ thống mở rộng.',
      zh: '在系统扩张之前先给出清晰答案。',
      es: 'Respuestas claras antes de que el sistema se expanda.',
      ja: 'システムが拡張する前に、明確な答えを用意する。',
      ko: '시스템이 확장되기 전에 명확한 답을 준비합니다.',
    },
    lead: {
      en: 'The fastest way to keep the platform aligned is to answer the category and system questions early and consistently.',
      vi: 'Cách nhanh nhất để giữ nền tảng đi đúng hướng là trả lời các câu hỏi về danh mục và hệ thống từ sớm, nhất quán.',
      zh: '要让平台始终保持一致，最快的方法就是尽早并持续一致地回答关于品类和系统的问题。',
      es: 'La forma más rápida de mantener la plataforma alineada es responder temprano y de forma consistente las preguntas de categoría y de sistema.',
      ja: 'プラットフォームの整合性を保つ最も速い方法は、カテゴリとシステムに関する問いに早い段階から一貫して答えることです。',
      ko: '플랫폼 정렬을 유지하는 가장 빠른 방법은 카테고리와 시스템에 관한 질문에 초기에 일관되게 답하는 것입니다.',
    },
  },
  questions: [
    {
      question: { en: 'Is OMDALA a marketplace?', vi: 'OMDALA có phải là sàn giao dịch không?', zh: 'OMDALA 是交易市场吗？', es: '¿OMDALA es un marketplace?', ja: 'OMDALA はマーケットプレイスですか？', ko: 'OMDALA는 마켓플레이스인가요?' },
      answer: {
        en: 'Not primarily. Marketplace behavior can exist inside the system, but OMDALA is broader: it handles identity, trust, matching, action, and proof.',
        vi: 'Không phải là trọng tâm chính. Chức năng giao dịch có thể tồn tại trong hệ thống, nhưng OMDALA rộng hơn: xử lý định danh, niềm tin, ghép nối, hành động và bằng chứng.',
        zh: '不以此为主。交易市场行为可以存在于系统内部，但 OMDALA 的范围更广，它处理身份、信任、匹配、行动和证明。',
        es: 'No principalmente. El comportamiento de marketplace puede existir dentro del sistema, pero OMDALA es más amplio: maneja identidad, confianza, emparejamiento, acción y prueba.',
        ja: '主目的ではありません。マーケットプレイス的な振る舞いはシステム内に存在し得ますが、OMDALA はそれより広く、身元、信頼、マッチング、行動、証明を扱います。',
        ko: '주된 정체성은 아닙니다. 마켓플레이스 동작은 시스템 안에 존재할 수 있지만, OMDALA는 그보다 넓게 신원, 신뢰, 매칭, 행동, 증빙을 다룹니다.',
      },
    },
    {
      question: { en: 'Is OMDALA only for AI workflows?', vi: 'OMDALA chỉ dành cho các quy trình AI?', zh: 'OMDALA 只用于 AI 工作流吗？', es: '¿OMDALA es solo para flujos de IA?', ja: 'OMDALA は AI ワークフロー専用ですか？', ko: 'OMDALA는 AI 워크플로 전용인가요?' },
      answer: {
        en: 'No. AI is a support layer for planning and orchestration. The product is ultimately about real operational outcomes.',
        vi: 'Không. AI là lớp hỗ trợ cho lập kế hoạch và điều phối. Giá trị cốt lõi vẫn là kết quả vận hành thực tế.',
        zh: '不是。AI 是规划和编排的支持层，产品的最终价值仍然是现实运营结果。',
        es: 'No. La IA es una capa de apoyo para planificación y orquestación. El valor final del producto sigue siendo el resultado operativo real.',
        ja: 'いいえ。AI は計画とオーケストレーションを支えるレイヤーです。製品の本質は最終的に現実の運用成果にあります。',
        ko: '아닙니다. AI는 계획과 오케스트레이션을 지원하는 레이어이며, 제품의 핵심 가치는 결국 실제 운영 결과입니다.',
      },
    },
    {
      question: { en: 'Who should use it first?', vi: 'Ai nên dùng trước?', zh: '谁应该先使用它？', es: '¿Quién debería usarlo primero?', ja: '誰が最初に使うべきですか？', ko: '누가 먼저 사용해야 하나요?' },
      answer: {
        en: 'Operators with real capacity to activate: experts, hosts, communities, and small business nodes.',
        vi: 'Những người vận hành có năng lực thật để kích hoạt: chuyên gia, đơn vị đón tiếp, cộng đồng và các nút doanh nghiệp nhỏ.',
        zh: '那些真正拥有可激活能力的运营者：专家、主理人、社区以及小企业节点。',
        es: 'Operadores con capacidad real de activación: expertos, hosts, comunidades y nodos de pequeñas empresas.',
        ja: '実際に活性化できる能力を持つオペレーター、つまり専門家、ホスト、コミュニティ、小規模ビジネスノードです。',
        ko: '실제로 활성화할 수 있는 역량을 가진 운영자, 즉 전문가, 호스트, 커뮤니티, 소규모 비즈니스 노드입니다.',
      },
    },
    {
      question: { en: 'Why is trust central?', vi: 'Vì sao niềm tin là trung tâm?', zh: '为什么信任是核心？', es: '¿Por qué la confianza es central?', ja: 'なぜ信頼が中心なのですか？', ko: '왜 신뢰가 중심인가요?' },
      answer: {
        en: 'Because weak trust destroys matching quality, discoverability, and repeat outcomes faster than feature gaps do.',
        vi: 'Vì niềm tin yếu sẽ phá chất lượng ghép nối, khả năng khám phá và kết quả lặp lại nhanh hơn nhiều so với thiếu tính năng.',
        zh: '因为薄弱的信任会比功能缺口更快地破坏匹配质量、可发现性和可重复结果。',
        es: 'Porque una confianza débil destruye la calidad del emparejamiento, la descubribilidad y los resultados repetibles más rápido que la falta de funciones.',
        ja: '信頼が弱いと、機能不足よりも速く、マッチング品質、発見性、反復成果を壊してしまうからです。',
        ko: '신뢰가 약하면 기능 격차보다 더 빠르게 매칭 품질, 발견 가능성, 반복 가능한 결과를 무너뜨리기 때문입니다.',
      },
    },
  ],
} as const

export const contactContent = {
  hero: {
    eyebrow: { en: 'Contact Surface', vi: 'Kênh liên hệ', zh: '联系界面', es: 'Superficie de contacto', ja: '連絡サーフェス', ko: '연락 화면' },
    title: {
      en: 'Contact the live OMDALA inbox layer.',
      vi: 'Liên hệ với kênh tiếp nhận chính thức của OMDALA.',
      zh: '联系 OMDALA 的在线收件箱层。',
      es: 'Contacta la capa de bandeja activa de OMDALA.',
      ja: '稼働中の OMDALA 受信トレイレイヤーに連絡する。',
      ko: '실행 중인 OMDALA 인박스 레이어에 연락하세요.',
    },
    lead: {
      en: 'Public contact now routes through the same mail system the platform uses for support, app onboarding, and operator response.',
      vi: 'Mọi liên hệ công khai hiện đi qua cùng hệ thống email mà nền tảng dùng cho hỗ trợ, khởi tạo ứng dụng và phản hồi vận hành.',
      zh: '公开联系现在会通过平台用于支持、应用引导和运营响应的同一邮件系统进行路由。',
      es: 'El contacto público ahora se enruta por el mismo sistema de correo que la plataforma usa para soporte, onboarding de app y respuesta operativa.',
      ja: '公開連絡は現在、サポート、アプリオンボーディング、運用応答に使われる同じメールシステムを通ってルーティングされます。',
      ko: '공개 연락은 이제 지원, 앱 온보딩, 운영 응답에 사용하는 동일한 메일 시스템을 통해 라우팅됩니다.',
    },
  },
  form: {
    title: { en: 'Contact form', vi: 'Biểu mẫu liên hệ', zh: '联系表单', es: 'Formulario de contacto', ja: 'お問い合わせフォーム', ko: '문의 양식' },
    copy: {
      en: 'Use this form for support, partnership discussions, trust questions, or product routing.',
      vi: 'Dùng biểu mẫu này cho hỗ trợ, trao đổi hợp tác, câu hỏi về niềm tin hoặc điều hướng sản phẩm.',
      zh: '使用此表单提交支持、合作洽谈、信任问题或产品分流请求。',
      es: 'Usa este formulario para soporte, conversaciones de partnership, preguntas de confianza o enrutamiento de producto.',
      ja: 'このフォームはサポート、提携相談、信頼に関する質問、またはプロダクトの振り分けに利用します。',
      ko: '이 양식은 지원, 파트너십 논의, 신뢰 관련 질문, 또는 제품 라우팅에 사용하세요.',
    },
  },
  inboxes: {
    title: { en: 'Official inboxes', vi: 'Hộp thư chính thức', zh: '官方收件箱', es: 'Bandejas oficiales', ja: '公式受信箱', ko: '공식 인박스' },
    copy: {
      en: 'These inboxes are the public routing points the web, app, docs, and operator layer can use immediately.',
      vi: 'Các hộp thư này là đầu mối điều phối công khai mà web, ứng dụng, tài liệu và đội vận hành có thể dùng ngay.',
      zh: '这些收件箱是 web、app、docs 与运营层可以立即使用的公开路由入口。',
      es: 'Estas bandejas son los puntos de enrutamiento público que web, app, docs y la capa operativa pueden usar de inmediato.',
      ja: 'これらの受信箱は、web、app、docs、運用レイヤーがすぐに利用できる公開ルーティングポイントです。',
      ko: '이 인박스들은 web, app, docs, 운영 레이어가 즉시 사용할 수 있는 공개 라우팅 지점입니다.',
    },
    cards: [
      { label: { en: 'General', vi: 'Tổng quát', zh: '综合', es: 'General', ja: '一般', ko: '일반' }, key: 'hello' },
      { label: { en: 'Support', vi: 'Hỗ trợ', zh: '支持', es: 'Soporte', ja: 'サポート', ko: '지원' }, key: 'support' },
      { label: { en: 'App', vi: 'Ứng dụng', zh: '应用', es: 'App', ja: 'アプリ', ko: '앱' }, key: 'app' },
      { label: { en: 'Trust', vi: 'Niềm tin', zh: '信任', es: 'Confianza', ja: '信頼', ko: '신뢰' }, key: 'trust' },
    ],
  },
  notes: [
    { en: 'Auth and magic-link mail', vi: 'Mail xác thực và magic-link', zh: '认证与 magic-link 邮件', es: 'Correo de auth y magic-link', ja: '認証と magic-link メール', ko: '인증 및 매직 링크 메일', key: 'noreply' },
    { en: 'Docs and API routing', vi: 'Điều hướng tài liệu và API', zh: '文档与 API 路由', es: 'Enrutamiento de docs y API', ja: 'Docs と API のルーティング', ko: '문서 및 API 라우팅', key: 'docs' },
    { en: 'Admin operations', vi: 'Vận hành quản trị', zh: '管理运营', es: 'Operaciones admin', ja: '管理運用', ko: '관리 운영', key: 'admin' },
  ],
} as const
