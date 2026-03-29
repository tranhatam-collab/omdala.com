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
      en: 'Global Coordination System',
      vi: 'Hệ điều phối toàn cầu',
    },
    title: {
      en: 'OMDALA turns people, places, and resources into coordinated value.',
      vi: 'OMDALA biến con người, địa điểm và tài nguyên thành giá trị được điều phối.',
    },
    lead: {
      en: 'OMDALA is the master operating layer for identity, resources, trust, matching, and AI-guided action across a growing network of people, organizations, and places.',
      vi: 'OMDALA là lớp vận hành chủ cho định danh, tài nguyên, niềm tin, ghép nối và hành động có AI hướng dẫn trên một mạng lưới con người, tổ chức và địa điểm đang mở rộng.',
    },
    ctaPrimary: { en: 'See the platform', vi: 'Xem nền tảng' },
    ctaSecondary: { en: 'Understand the system', vi: 'Hiểu cách vận hành' },
    ctaDocs: { en: 'Open docs', vi: 'Mở tài liệu' },
  },
  platformLogic: {
    eyebrow: { en: 'Platform Logic', vi: 'Logic nền tảng' },
    title: {
      en: 'Built as a master layer, not a single-use app',
      vi: 'Được xây như lớp chủ, không phải ứng dụng một mục đích',
    },
    copy: {
      en: 'The system starts from a simple question: what value already exists but is not being coordinated well enough to create trusted outcomes? OMDALA answers that through visibility, activation, trust, and follow-through.',
      vi: 'Hệ thống bắt đầu từ một câu hỏi đơn giản: giá trị nào đã tồn tại nhưng chưa được điều phối đủ tốt để tạo kết quả đáng tin? OMDALA trả lời bằng khả năng nhìn thấy, kích hoạt, xây niềm tin và theo đuổi đến cùng.',
    },
    metrics: [
      {
        title: { en: 'Identity', vi: 'Định danh' },
        copy: {
          en: 'Model people, teams, places, and organizations as living nodes with goals and capacity.',
          vi: 'Mô hình hóa con người, nhóm, địa điểm và tổ chức thành các node sống có mục tiêu và năng lực.',
        },
      },
      {
        title: { en: 'Resources', vi: 'Tài nguyên' },
        copy: {
          en: 'Track underused time, space, knowledge, services, assets, and network potential.',
          vi: 'Theo dõi thời gian, không gian, tri thức, dịch vụ, tài sản và tiềm năng mạng lưới đang chưa khai thác.',
        },
      },
      {
        title: { en: 'Trust', vi: 'Niềm tin' },
        copy: {
          en: 'Turn proof, verification, behavior, and completion into durable confidence signals.',
          vi: 'Biến bằng chứng, xác thực, hành vi và mức độ hoàn thành thành tín hiệu tin cậy bền vững.',
        },
      },
      {
        title: { en: 'Action', vi: 'Hành động' },
        copy: {
          en: 'Use orchestration, messaging, booking, and AI plans to move from intention to execution.',
          vi: 'Dùng điều phối, nhắn tin, đặt lịch và kế hoạch AI để đi từ ý định đến triển khai.',
        },
      },
    ],
  },
  operators: {
    eyebrow: { en: 'Who It Serves', vi: 'Đối tượng phục vụ' },
    title: {
      en: 'Designed for real operators with real capacity',
      vi: 'Thiết kế cho người vận hành có năng lực thực',
    },
    copy: {
      en: 'The first fit is not everyone. The first fit is people and organizations that already have value to activate but lack a serious coordination layer.',
      vi: 'Phù hợp giai đoạn đầu không phải tất cả mọi người. Đó là người và tổ chức đã có giá trị để kích hoạt nhưng thiếu một lớp điều phối nghiêm túc.',
    },
    cards: [
      {
        title: { en: 'Experts', vi: 'Chuyên gia' },
        copy: {
          en: 'Package skill, time, and trust into structured offers instead of scattered outreach.',
          vi: 'Đóng gói kỹ năng, thời gian và niềm tin thành đề nghị có cấu trúc thay vì kết nối rời rạc.',
        },
      },
      {
        title: { en: 'Hosts', vi: 'Điểm đón' },
        copy: {
          en: 'Turn places, availability, and local reputation into higher-quality utilization.',
          vi: 'Biến không gian, mức sẵn sàng và uy tín địa phương thành khả năng khai thác chất lượng hơn.',
        },
      },
      {
        title: { en: 'Communities', vi: 'Cộng đồng' },
        copy: {
          en: 'Coordinate members, shared assets, events, and governance without operational chaos.',
          vi: 'Điều phối thành viên, tài sản chung, sự kiện và quản trị mà không rối loạn vận hành.',
        },
      },
      {
        title: { en: 'Small businesses', vi: 'Doanh nghiệp nhỏ' },
        copy: {
          en: 'See idle capacity, improve matching, and run trust-backed operations in one system.',
          vi: 'Nhìn thấy công suất nhàn rỗi, cải thiện ghép nối và vận hành dựa trên niềm tin trong một hệ thống.',
        },
      },
    ],
  },
  loop: {
    eyebrow: { en: 'Core Loop', vi: 'Vòng lặp cốt lõi' },
    title: {
      en: 'See value. Activate it. Prove it. Compound it.',
      vi: 'Nhìn thấy giá trị. Kích hoạt. Chứng minh. Tích lũy.',
    },
    items: [
      {
        title: { en: '1. See what exists', vi: '1. Nhìn rõ hiện trạng' },
        copy: {
          en: 'Inventory nodes, resources, trust status, needs, and network context.',
          vi: 'Kiểm kê node, tài nguyên, trạng thái niềm tin, nhu cầu và bối cảnh mạng lưới.',
        },
      },
      {
        title: { en: '2. Structure what matters', vi: '2. Chuẩn hóa điều quan trọng' },
        copy: {
          en: 'Turn loose intent into requests, offers, availability, tasks, and booking-ready objects.',
          vi: 'Biến ý định rời rạc thành nhu cầu, đề nghị, khả năng sẵn sàng, tác vụ và đối tượng có thể đặt lịch.',
        },
      },
      {
        title: { en: '3. Match with context', vi: '3. Ghép theo ngữ cảnh' },
        copy: {
          en: 'Score fit by relevance, trust, timing, capability, and expected operational outcome.',
          vi: 'Chấm mức phù hợp theo độ liên quan, niềm tin, thời điểm, năng lực và kết quả vận hành kỳ vọng.',
        },
      },
      {
        title: { en: '4. Move to action', vi: '4. Chuyển sang hành động' },
        copy: {
          en: 'Use AI drafts, messaging, booking, payments, and task flows to complete the work.',
          vi: 'Dùng bản nháp AI, nhắn tin, đặt lịch, thanh toán và luồng công việc để hoàn thành tác vụ.',
        },
      },
      {
        title: { en: '5. Store proof and trust', vi: '5. Lưu bằng chứng và niềm tin' },
        copy: {
          en: 'Record outcomes so every completed interaction strengthens future discoverability.',
          vi: 'Ghi nhận kết quả để mỗi tương tác hoàn tất đều tăng khả năng được khám phá trong tương lai.',
        },
      },
    ],
  },
  surfaces: {
    eyebrow: { en: 'Platform Surfaces', vi: 'Các bề mặt nền tảng' },
    title: {
      en: 'One master brand across the full operating stack',
      vi: 'Một thương hiệu chủ cho toàn bộ tầng vận hành',
    },
    cards: [
      {
        label: 'omdala.com',
        copy: {
          en: 'Public brand, positioning, onboarding, trust explanation, and category definition.',
          vi: 'Bề mặt thương hiệu công khai, định vị, onboarding, giải thích niềm tin và định nghĩa danh mục.',
        },
      },
      {
        label: 'app.omdala.com',
        copy: {
          en: 'Authenticated application for nodes, offers, requests, trust, and action workflows.',
          vi: 'Ứng dụng xác thực cho node, đề nghị, nhu cầu, niềm tin và luồng hành động.',
        },
      },
      {
        label: 'docs.omdala.com',
        copy: {
          en: 'Developer and product documentation for system contracts, architecture, and APIs.',
          vi: 'Tài liệu kỹ thuật và sản phẩm cho hợp đồng hệ thống, kiến trúc và API.',
        },
      },
      {
        label: 'api.omdala.com',
        copy: {
          en: 'Versioned API layer for identity, resources, matching, trust, and orchestration services.',
          vi: 'Lớp API có phiên bản cho định danh, tài nguyên, ghép nối, niềm tin và dịch vụ điều phối.',
        },
      },
    ],
  },
  mockSignals: [
    {
      metric: '12',
      label: { en: 'Core route contracts', vi: 'Hợp đồng route lõi' },
      detail: { en: 'Public web routes now mapped with canonical + schema runtime.', vi: 'Route web công khai đã được map với canonical + schema runtime.' },
    },
    {
      metric: '2',
      label: { en: 'Live locales', vi: 'Ngôn ngữ đang chạy' },
      detail: { en: 'English-first with full Vietnamese overlay and expansion hooks.', vi: 'English-first với lớp tiếng Việt đầy đủ và hook mở rộng.' },
    },
    {
      metric: '10',
      label: { en: 'Structured content modules', vi: 'Module nội dung có cấu trúc' },
      detail: { en: 'All major public pages read from typed content objects.', vi: 'Các trang public chính đọc từ object nội dung có kiểu.' },
    },
  ],
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
