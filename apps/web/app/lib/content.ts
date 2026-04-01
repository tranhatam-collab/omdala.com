export type WebLocale = 'en' | 'vi'

export type LocalizedText = {
  en: string
  vi: string
}

export function pickText(locale: WebLocale, text: LocalizedText): string {
  return text[locale]
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
    ctaPrimary: { en: 'Start Building Reality', vi: 'Bắt đầu kiến tạo' },
    ctaSecondary: { en: 'Explore the System', vi: 'Khám phá hệ thống' },
    ctaDocs: { en: 'Open Docs', vi: 'Mở tài liệu' },
  },
  loop: {
    eyebrow: { en: 'Core Loop', vi: 'Vòng lặp cốt lõi' },
    title: {
      en: 'How OMDALA Works',
      vi: 'Cách OMDALA vận hành',
    },
    items: [
      {
        title: { en: '1. See Value', vi: '1. Thấy giá trị' },
        copy: {
          en: 'Discover people, places, and resources around you.',
          vi: 'Khám phá con người, địa điểm và tài nguyên xung quanh bạn.',
        },
      },
      {
        title: { en: '2. Activate It', vi: '2. Kích hoạt' },
        copy: {
          en: 'Structure resources and define desired outcomes.',
          vi: 'Cấu trúc hóa tài nguyên và xác định kết quả mong muốn.',
        },
      },
      {
        title: { en: '3. Prove It', vi: '3. Chứng minh' },
        copy: {
          en: 'Execute commitments and attach verifiable proof.',
          vi: 'Thực thi cam kết và đính kèm bằng chứng có thể kiểm chứng.',
        },
      },
      {
        title: { en: '4. Compound It', vi: '4. Tích lũy' },
        copy: {
          en: 'Build trust that grows with every completed action.',
          vi: 'Xây dựng niềm tin lớn mạnh sau mỗi hành động hoàn tất.',
        },
      },
    ],
  },
  stateTransition: {
    eyebrow: { en: 'State Transition Layer', vi: 'Lớp chuyển đổi trạng thái' },
    title: {
      en: 'From Current Reality to Desired Reality',
      vi: 'Từ thực tại hiện có đến thực tại mong muốn',
    },
    copy: {
      en: 'Every node in OMDALA has a current state and a desired state. The system continuously plans and executes transitions between them — using real resources, real commitments, and verifiable outcomes.',
      vi: 'Mỗi node trong OMDALA đều có một trạng thái hiện tại và trạng thái mong muốn. Hệ thống liên tục lập kế hoạch và thực thi việc chuyển đổi giữa chúng — sử dụng tài nguyên thật, cam kết thật và kết quả có thể kiểm chứng.',
    },
    concepts: [
      { en: 'Current State', vi: 'Trạng thái hiện tại' },
      { en: 'Desired State', vi: 'Trạng thái mong muốn' },
      { en: 'Transition Path', vi: 'Đường dẫn chuyển đổi' },
      { en: 'Constraints', vi: 'Các ràng buộc' },
      { en: 'Outcomes', vi: 'Kết quả' },
    ],
  },
  commitments: {
    eyebrow: { en: 'Commitments Engine', vi: 'Động cơ cam kết' },
    title: {
      en: 'Coordination Through Commitments',
      vi: 'Điều phối thông qua cam kết',
    },
    copy: {
      en: 'Offers and requests are just the surface. At the core of OMDALA is a commitment engine — where nodes define what they will do, under what conditions, and how success is verified.',
      vi: 'Đề nghị và nhu cầu chỉ là bề mặt. Cốt lõi của OMDALA là một động cơ cam kết — nơi các node xác định họ sẽ làm gì, dưới điều kiện nào, và sự thành công được xác thực ra sao.',
    },
    features: [
      { en: 'Multi-party commitments', vi: 'Cam kết đa bên' },
      { en: 'Conditional execution', vi: 'Thực thi có điều kiện' },
      { en: 'Deadlines & consequences', vi: 'Thời hạn & hệ quả' },
      { en: 'Approval flows', vi: 'Luồng phê duyệt' },
    ],
  },
  trust: {
    eyebrow: { en: 'Proof & Trust System', vi: 'Hệ thống bằng chứng & niềm tin' },
    title: {
      en: 'Trust Is Built, Not Claimed',
      vi: 'Niềm tin được xây dựng, không phải tự xưng',
    },
    copy: {
      en: 'Trust in OMDALA is not based on ratings alone. It is built from verifiable actions, completed commitments, and transparent governance.',
      vi: 'Niềm tin trong OMDALA không chỉ dựa trên đánh giá. Nó được xây từ các hành động có thể kiểm chứng, cam kết đã hoàn tất, và sự quản trị minh bạch.',
    },
    signals: [
      { en: 'Verified identity', vi: 'Định danh xác thực' },
      { en: 'Proof of completion', vi: 'Bằng chứng hoàn thành' },
      { en: 'Behavioral history', vi: 'Lịch sử hành vi' },
      { en: 'Governance decisions', vi: 'Quyết định quản trị' },
    ],
  },
  governance: {
    eyebrow: { en: 'AGI-Safe Governance', vi: 'Quản trị an toàn cho AGI' },
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
    eyebrow: { en: 'System Map', vi: 'Bản đồ hệ thống' },
    title: {
      en: 'The OMDALA System',
      vi: 'Hệ thống OMDALA',
    },
    layers: [
      { en: 'Brand Layer', vi: 'Lớp thương hiệu' },
      { en: 'App Layer', vi: 'Lớp ứng dụng' },
      { en: 'Trust Layer', vi: 'Lớp niềm tin' },
      { en: 'Proof Layer', vi: 'Lớp bằng chứng' },
      { en: 'Graph Layer', vi: 'Lớp đồ thị' },
      { en: 'API Layer', vi: 'Lớp API' },
      { en: 'AI Layer', vi: 'Lớp AI' },
    ],
  },
  useCases: {
    eyebrow: { en: 'Use Cases', vi: 'Trường hợp sử dụng' },
    title: {
      en: 'What You Can Do',
      vi: 'Những gì bạn có thể làm',
    },
    examples: [
      { en: 'Eliminate overdue payments', vi: 'Xóa bỏ nợ quá hạn' },
      { en: 'Activate idle resources', vi: 'Kích hoạt tài nguyên nhàn rỗi' },
      { en: 'Coordinate teams and communities', vi: 'Điều phối đội ngũ và cộng đồng' },
      { en: 'Deliver outcomes with proof', vi: 'Giao kết quả kèm bằng chứng' },
    ],
  },
  ctaFinal: {
    title: {
      en: 'Build Your Reality with OMDALA',
      vi: 'Kiến tạo thực tại của bạn cùng OMDALA',
    },
    primary: { en: 'Start Now', vi: 'Bắt đầu ngay' },
    secondary: { en: 'Talk to Us', vi: 'Trò chuyện với chúng tôi' },
  }
} as const

export const definitionContent = {
  hero: {
    eyebrow: { en: 'Definition', vi: 'Định nghĩa' },
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
      title: { en: 'What it is', vi: 'Đây là gì' },
      copy: {
        en: 'A platform for coordinating people, places, organizations, resources, and outcomes.',
        vi: 'Một nền tảng điều phối con người, địa điểm, tổ chức, tài nguyên và kết quả.',
      },
    },
    {
      title: { en: 'What it is not', vi: 'Không phải gì' },
      copy: {
        en: 'A noisy feed, a thin directory, a one-feature app, or an AI chatbot with no system role.',
        vi: 'Không phải newsfeed ồn ào, danh bạ mỏng, ứng dụng một tính năng hay chatbot AI không vai trò hệ thống.',
      },
    },
    {
      title: { en: 'Where it sits', vi: 'Vị trí của nó' },
      copy: {
        en: 'At the masterbrand level: web, app, API, docs, trust, and admin surfaces all flow from it.',
        vi: 'Ở tầng thương hiệu chủ: các bề mặt web, app, API, docs, trust và admin đều xuất phát từ đây.',
      },
    },
  ],
  layers: {
    eyebrow: { en: 'Core Layers', vi: 'Các lớp cốt lõi' },
    title: {
      en: 'The platform is designed as five layers working together',
      vi: 'Nền tảng được thiết kế gồm 5 lớp phối hợp',
    },
    items: [
      { en: 'Identity: nodes, roles, ownership, visibility, and trust baseline.', vi: 'Định danh: node, vai trò, quyền sở hữu, mức hiển thị và nền niềm tin.' },
      { en: 'Resources: time, space, skill, knowledge, capacity, and underused assets.', vi: 'Tài nguyên: thời gian, không gian, kỹ năng, tri thức, năng lực và tài sản nhàn rỗi.' },
      { en: 'Coordination: offers, requests, matching, messaging, bookings, and tasks.', vi: 'Điều phối: đề nghị, nhu cầu, ghép nối, nhắn tin, đặt lịch và tác vụ.' },
      { en: 'Trust: verification, proof, behavior, governance, and explainable reputation.', vi: 'Niềm tin: xác thực, bằng chứng, hành vi, quản trị và uy tín có thể giải thích.' },
      { en: 'Intelligence: AI planning, orchestration, prioritization, and action support.', vi: 'Trí tuệ: lập kế hoạch AI, điều phối, ưu tiên và hỗ trợ hành động.' },
    ],
  },
} as const

export const processContent = {
  hero: {
    eyebrow: { en: 'System Logic', vi: 'Logic hệ thống' },
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
      title: { en: '1. Map the node', vi: '1. Lập bản đồ node' },
      copy: { en: 'Capture identity, goals, roles, availability, assets, and current trust state.', vi: 'Ghi nhận định danh, mục tiêu, vai trò, mức sẵn sàng, tài sản và trạng thái niềm tin hiện tại.' },
    },
    {
      title: { en: '2. Normalize the resource', vi: '2. Chuẩn hóa tài nguyên' },
      copy: { en: 'Turn loose information into resource objects, offers, requests, and operational states.', vi: 'Biến thông tin rời rạc thành đối tượng tài nguyên, đề nghị, nhu cầu và trạng thái vận hành.' },
    },
    {
      title: { en: '3. Score the fit', vi: '3. Chấm điểm phù hợp' },
      copy: { en: 'Use matching signals such as trust, timing, relevance, locality, capacity, and intent.', vi: 'Dùng tín hiệu ghép nối như niềm tin, thời điểm, mức liên quan, địa phương, năng lực và ý định.' },
    },
    {
      title: { en: '4. Convert to execution', vi: '4. Chuyển thành thực thi' },
      copy: { en: 'Draft messages, create tasks, open bookings, and guide follow-through with AI assistance.', vi: 'Soạn nhắn tin, tạo tác vụ, mở đặt lịch và dẫn dắt theo đuổi với hỗ trợ AI.' },
    },
    {
      title: { en: '5. Record proof', vi: '5. Ghi nhận bằng chứng' },
      copy: { en: 'Attach receipts, confirmations, outputs, endorsements, and verification artifacts.', vi: 'Gắn biên nhận, xác nhận, đầu ra, bảo chứng và tạo tác xác thực.' },
    },
    {
      title: { en: '6. Compound trust', vi: '6. Tích lũy niềm tin' },
      copy: { en: 'Use outcomes to increase discoverability, reduce risk, and improve future opportunity quality.', vi: 'Dùng kết quả để tăng khả năng khám phá, giảm rủi ro và nâng chất lượng cơ hội tương lai.' },
    },
  ],
} as const

export const audiencePages = {
  experts: {
    hero: {
      eyebrow: { en: 'For Experts', vi: 'Dành cho chuyên gia' },
      title: { en: 'Turn expertise into structured, trusted opportunity.', vi: 'Biến chuyên môn thành cơ hội có cấu trúc và đáng tin.' },
      lead: {
        en: 'OMDALA helps specialists, advisors, creators, and operators package time, knowledge, and credibility into offers, requests, and repeatable trust-backed workflows.',
        vi: 'OMDALA giúp chuyên gia, cố vấn, nhà sáng tạo và người vận hành đóng gói thời gian, tri thức và uy tín thành đề nghị, nhu cầu và luồng công việc lặp lại dựa trên niềm tin.',
      },
    },
    cards: [
      {
        title: { en: 'Package your value', vi: 'Đóng gói giá trị của bạn' },
        copy: { en: 'Convert expertise, availability, and goals into clear offers and operational objects.', vi: 'Chuyển chuyên môn, mức sẵn sàng và mục tiêu thành đề nghị rõ ràng và đối tượng vận hành.' },
      },
      {
        title: { en: 'Improve signal quality', vi: 'Nâng chất lượng tín hiệu' },
        copy: { en: 'Use proof, verification, and completion history to make discovery more trustworthy.', vi: 'Dùng bằng chứng, xác thực và lịch sử hoàn thành để tăng độ tin cậy khi được khám phá.' },
      },
      {
        title: { en: 'Act faster', vi: 'Hành động nhanh hơn' },
        copy: { en: 'Move from idea to outreach, booking, pricing, and task lists with AI support.', vi: 'Đi từ ý tưởng đến tiếp cận, đặt lịch, định giá và danh sách tác vụ với hỗ trợ AI.' },
      },
    ],
  },
  hosts: {
    hero: {
      eyebrow: { en: 'For Hosts', vi: 'Dành cho điểm đón' },
      title: { en: 'Turn place capacity into higher-quality utilization.', vi: 'Biến năng lực địa điểm thành mức khai thác chất lượng cao hơn.' },
      lead: {
        en: 'Hosts need more than listings. They need fit, timing, trust, and operational follow-through. OMDALA is designed to structure that full loop.',
        vi: 'Điểm đón cần nhiều hơn danh sách hiển thị. Họ cần mức phù hợp, thời điểm, niềm tin và theo đuổi vận hành. OMDALA được thiết kế để cấu trúc toàn bộ vòng lặp đó.',
      },
    },
    items: [
      { en: 'Model spaces, availability, and place rules as structured resources.', vi: 'Mô hình hóa không gian, mức sẵn sàng và quy tắc địa điểm thành tài nguyên có cấu trúc.' },
      { en: 'Match against trust level, purpose, timing, and expected operational fit.', vi: 'Ghép nối theo mức niềm tin, mục tiêu, thời điểm và mức phù hợp vận hành kỳ vọng.' },
      { en: 'Use proofs and historical outcomes to strengthen future bookings.', vi: 'Dùng bằng chứng và kết quả lịch sử để củng cố các lần đặt lịch tương lai.' },
      { en: 'Move from inquiry to action with messaging, tasks, and booking states.', vi: 'Đi từ yêu cầu đến hành động bằng nhắn tin, tác vụ và trạng thái đặt lịch.' },
    ],
  },
  communities: {
    hero: {
      eyebrow: { en: 'For Communities', vi: 'Dành cho cộng đồng' },
      title: { en: 'Run groups, assets, and governance with more clarity.', vi: 'Vận hành nhóm, tài sản và quản trị rõ ràng hơn.' },
      lead: {
        en: 'Communities become stronger when shared resources, roles, proof, and coordination live in one calm system instead of fragmented threads and manual workarounds.',
        vi: 'Cộng đồng mạnh hơn khi tài nguyên chung, vai trò, bằng chứng và điều phối nằm trong một hệ thống thống nhất thay vì các luồng rời rạc và xử lý thủ công.',
      },
    },
    cards: [
      { title: { en: 'Shared resources', vi: 'Tài nguyên dùng chung' }, copy: { en: 'Track assets, availability, events, and responsibilities across the group.', vi: 'Theo dõi tài sản, mức sẵn sàng, sự kiện và trách nhiệm trong toàn nhóm.' } },
      { title: { en: 'Member trust', vi: 'Niềm tin thành viên' }, copy: { en: 'Build visible reliability through proof, participation, role history, and governance logs.', vi: 'Xây dựng độ tin cậy nhìn thấy được qua bằng chứng, mức tham gia, lịch sử vai trò và nhật ký quản trị.' } },
      { title: { en: 'Operational memory', vi: 'Bộ nhớ vận hành' }, copy: { en: 'Keep community actions auditable so valuable knowledge does not disappear into chat.', vi: 'Giữ hành động cộng đồng có thể kiểm toán để tri thức giá trị không biến mất trong luồng chat.' } },
    ],
  },
} as const

export const trustContent = {
  hero: {
    eyebrow: { en: 'Trust by Design', vi: 'Niềm tin theo thiết kế' },
    title: { en: 'Trust is infrastructure, not decoration.', vi: 'Niềm tin là hạ tầng, không phải trang trí.' },
    lead: {
      en: 'OMDALA does not reduce trust to stars and vibes. It treats trust as a system built from evidence, behavior, completion, governance, and explainable visibility rules.',
      vi: 'OMDALA không rút gọn niềm tin thành sao đánh giá cảm tính. Hệ thống xem niềm tin là cấu trúc được xây từ bằng chứng, hành vi, mức hoàn thành, quản trị và quy tắc hiển thị có thể giải thích.',
    },
  },
  cards: [
    { title: { en: 'Verification', vi: 'Xác thực' }, copy: { en: 'Identity, ownership, payment, affiliation, and other factual checks where appropriate.', vi: 'Định danh, quyền sở hữu, thanh toán, liên kết và các kiểm tra sự thật khi phù hợp.' } },
    { title: { en: 'Proof', vi: 'Bằng chứng' }, copy: { en: 'Receipts, confirmations, outputs, attendance, delivery, and completion evidence.', vi: 'Biên nhận, xác nhận, đầu ra, điểm danh, bàn giao và bằng chứng hoàn thành.' } },
    { title: { en: 'Behavior', vi: 'Hành vi' }, copy: { en: 'Response quality, reliability, cancellation patterns, dispute history, and follow-through.', vi: 'Chất lượng phản hồi, độ tin cậy, mẫu hủy, lịch sử tranh chấp và khả năng theo đuổi.' } },
    { title: { en: 'Governance', vi: 'Quản trị' }, copy: { en: 'Warnings, overrides, moderation actions, and audit trails for sensitive decisions.', vi: 'Cảnh báo, ghi đè, hành động kiểm duyệt và dấu vết kiểm toán cho quyết định nhạy cảm.' } },
  ],
} as const

export const visionContent = {
  hero: {
    eyebrow: { en: 'Long-Term Vision', vi: 'Tầm nhìn dài hạn' },
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
    { title: { en: '10-year horizon', vi: 'Tầm nhìn 10 năm' }, copy: { en: 'Become indispensable for experts, hosts, communities, and small business nodes.', vi: 'Trở thành hạ tầng không thể thiếu cho chuyên gia, điểm đón, cộng đồng và các node doanh nghiệp nhỏ.' } },
    { title: { en: '25-year horizon', vi: 'Tầm nhìn 25 năm' }, copy: { en: 'Operate as shared infrastructure for distributed networks, assets, and local economies.', vi: 'Vận hành như hạ tầng chung cho mạng lưới phân tán, tài sản và kinh tế địa phương.' } },
    { title: { en: '100-year horizon', vi: 'Tầm nhìn 100 năm' }, copy: { en: 'Remain valuable because trust, coordination, proof, and resource activation are durable needs.', vi: 'Duy trì giá trị vì niềm tin, điều phối, bằng chứng và kích hoạt tài nguyên là nhu cầu bền vững.' } },
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
      question: { en: 'Is OMDALA a marketplace?', vi: 'OMDALA có phải là marketplace không?' },
      answer: {
        en: 'Not primarily. Marketplace behavior can exist inside the system, but OMDALA is broader: it handles identity, trust, matching, action, and proof.',
        vi: 'Không phải trọng tâm chính. Hành vi marketplace có thể tồn tại trong hệ thống, nhưng OMDALA rộng hơn: xử lý định danh, niềm tin, ghép nối, hành động và bằng chứng.',
      },
    },
    {
      question: { en: 'Is OMDALA only for AI workflows?', vi: 'OMDALA chỉ dành cho workflow AI?' },
      answer: {
        en: 'No. AI is a support layer for planning and orchestration. The product is ultimately about real operational outcomes.',
        vi: 'Không. AI là lớp hỗ trợ cho lập kế hoạch và điều phối. Giá trị cốt lõi vẫn là kết quả vận hành thực tế.',
      },
    },
    {
      question: { en: 'Who should use it first?', vi: 'Ai nên dùng trước?' },
      answer: {
        en: 'Operators with real capacity to activate: experts, hosts, communities, and small business nodes.',
        vi: 'Những người vận hành có năng lực thật để kích hoạt: chuyên gia, điểm đón, cộng đồng và các node doanh nghiệp nhỏ.',
      },
    },
    {
      question: { en: 'Why is trust central?', vi: 'Vì sao niềm tin là trung tâm?' },
      answer: {
        en: 'Because weak trust destroys matching quality, discoverability, and repeat outcomes faster than feature gaps do.',
        vi: 'Vì niềm tin yếu sẽ phá chất lượng ghép nối, khả năng khám phá và kết quả lặp lại nhanh hơn nhiều so với thiếu tính năng.',
      },
    },
  ],
} as const

export const contactContent = {
  hero: {
    eyebrow: { en: 'Contact Surface', vi: 'Bề mặt liên hệ' },
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
    title: { en: 'Contact form', vi: 'Biểu mẫu liên hệ' },
    copy: {
      en: 'Use this form for support, partnership discussions, trust questions, or product routing.',
      vi: 'Dùng biểu mẫu này cho hỗ trợ, trao đổi hợp tác, câu hỏi về niềm tin hoặc điều hướng sản phẩm.',
    },
  },
  inboxes: {
    title: { en: 'Official inboxes', vi: 'Hộp thư chính thức' },
    copy: {
      en: 'These inboxes are the public routing points the web, app, docs, and operator layer can use immediately.',
      vi: 'Các hộp thư này là điểm điều hướng công khai mà lớp web, app, docs và vận hành có thể dùng ngay.',
    },
    cards: [
      { label: { en: 'General', vi: 'Tổng quát' }, key: 'hello' },
      { label: { en: 'Support', vi: 'Hỗ trợ' }, key: 'support' },
      { label: { en: 'App', vi: 'Ứng dụng' }, key: 'app' },
      { label: { en: 'Trust', vi: 'Niềm tin' }, key: 'trust' },
    ],
  },
  notes: [
    { en: 'Auth and magic-link mail', vi: 'Mail xác thực và magic-link', key: 'noreply' },
    { en: 'Docs and API routing', vi: 'Điều hướng docs và API', key: 'docs' },
    { en: 'Admin operations', vi: 'Vận hành admin', key: 'admin' },
  ],
} as const
