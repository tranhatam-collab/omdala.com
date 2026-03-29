'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'
import { LocaleLink } from './components/LocaleLink'

export default function HomePage() {
  const [isVi, setIsVi] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsVi(resolveLanguage(new URLSearchParams(window.location.search).get('lang')) === 'vi')
  }, [])

  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">{isVi ? 'Hệ điều phối toàn cầu' : 'Global Coordination System'}</p>
        <h1>
          {isVi
            ? 'OMDALA biến con người, địa điểm và tài nguyên thành giá trị được điều phối.'
            : 'OMDALA turns people, places, and resources into coordinated value.'}
        </h1>
        <p className="lead">
          {isVi
            ? 'OMDALA là lớp vận hành chủ cho định danh, tài nguyên, niềm tin, ghép nối và hành động có AI hướng dẫn trên một mạng lưới con người, tổ chức và địa điểm đang mở rộng.'
            : 'OMDALA is the master operating layer for identity, resources, trust, matching, and AI-guided action across a growing network of people, organizations, and places.'}
        </p>
        <div className="button-row">
          <LocaleLink href="/what-is-omdala" className="site-button site-button--primary">
            {isVi ? 'Xem nền tảng' : 'See the platform'}
          </LocaleLink>
          <LocaleLink href="/how-it-works" className="site-button site-button--ghost">
            {isVi ? 'Hiểu cách vận hành' : 'Understand the system'}
          </LocaleLink>
          <a href="https://docs.omdala.com" className="site-button site-button--ghost">
            {isVi ? 'Mở tài liệu' : 'Open docs'}
          </a>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{isVi ? 'Logic nền tảng' : 'Platform Logic'}</p>
          <h2>{isVi ? 'Được xây như lớp chủ, không phải ứng dụng một mục đích' : 'Built as a master layer, not a single-use app'}</h2>
          <p className="section-copy">
            {isVi
              ? 'Hệ thống bắt đầu từ một câu hỏi đơn giản: giá trị nào đã tồn tại nhưng chưa được điều phối đủ tốt để tạo kết quả đáng tin? OMDALA trả lời bằng khả năng nhìn thấy, kích hoạt, xây niềm tin và theo đuổi đến cùng.'
              : 'The system starts from a simple question: what value already exists but is not being coordinated well enough to create trusted outcomes? OMDALA answers that through visibility, activation, trust, and follow-through.'}
          </p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <strong>{isVi ? 'Định danh' : 'Identity'}</strong>
            <p>{isVi ? 'Mô hình hóa con người, nhóm, địa điểm và tổ chức thành các node sống có mục tiêu và năng lực.' : 'Model people, teams, places, and organizations as living nodes with goals and capacity.'}</p>
          </article>
          <article className="metric-card">
            <strong>{isVi ? 'Tài nguyên' : 'Resources'}</strong>
            <p>{isVi ? 'Theo dõi thời gian, không gian, tri thức, dịch vụ, tài sản và tiềm năng mạng lưới đang chưa khai thác.' : 'Track underused time, space, knowledge, services, assets, and network potential.'}</p>
          </article>
          <article className="metric-card">
            <strong>{isVi ? 'Niềm tin' : 'Trust'}</strong>
            <p>{isVi ? 'Biến bằng chứng, xác thực, hành vi và mức độ hoàn thành thành tín hiệu tin cậy bền vững.' : 'Turn proof, verification, behavior, and completion into durable confidence signals.'}</p>
          </article>
          <article className="metric-card">
            <strong>{isVi ? 'Hành động' : 'Action'}</strong>
            <p>{isVi ? 'Dùng điều phối, nhắn tin, đặt lịch và kế hoạch AI để đi từ ý định đến triển khai.' : 'Use orchestration, messaging, booking, and AI plans to move from intention to execution.'}</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{isVi ? 'Đối tượng phục vụ' : 'Who It Serves'}</p>
          <h2>{isVi ? 'Thiết kế cho người vận hành có năng lực thực' : 'Designed for real operators with real capacity'}</h2>
          <p className="section-copy">
            {isVi
              ? 'Phù hợp giai đoạn đầu không phải tất cả mọi người. Đó là người và tổ chức đã có giá trị để kích hoạt nhưng thiếu một lớp điều phối nghiêm túc.'
              : 'The first fit is not everyone. The first fit is people and organizations that already have value to activate but lack a serious coordination layer.'}
          </p>
        </div>

        <div className="card-grid">
          <article>
            <h3>{isVi ? 'Chuyên gia' : 'Experts'}</h3>
            <p>{isVi ? 'Đóng gói kỹ năng, thời gian và niềm tin thành đề nghị có cấu trúc thay vì kết nối rời rạc.' : 'Package skill, time, and trust into structured offers instead of scattered outreach.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Điểm đón' : 'Hosts'}</h3>
            <p>{isVi ? 'Biến không gian, mức sẵn sàng và uy tín địa phương thành khả năng khai thác chất lượng hơn.' : 'Turn places, availability, and local reputation into higher-quality utilization.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Cộng đồng' : 'Communities'}</h3>
            <p>{isVi ? 'Điều phối thành viên, tài sản chung, sự kiện và quản trị mà không rối loạn vận hành.' : 'Coordinate members, shared assets, events, and governance without operational chaos.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Doanh nghiệp nhỏ' : 'Small businesses'}</h3>
            <p>{isVi ? 'Nhìn thấy công suất nhàn rỗi, cải thiện ghép nối và vận hành dựa trên niềm tin trong một hệ thống.' : 'See idle capacity, improve matching, and run trust-backed operations in one system.'}</p>
          </article>
        </div>

        <div className="page-links">
          <LocaleLink href="/for-experts">{isVi ? 'Cho chuyên gia' : 'For experts'}</LocaleLink>
          <LocaleLink href="/for-hosts">{isVi ? 'Cho điểm đón' : 'For hosts'}</LocaleLink>
          <LocaleLink href="/for-communities">{isVi ? 'Cho cộng đồng' : 'For communities'}</LocaleLink>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{isVi ? 'Vòng lặp cốt lõi' : 'Core Loop'}</p>
          <h2>{isVi ? 'Nhìn thấy giá trị. Kích hoạt. Chứng minh. Tích lũy.' : 'See value. Activate it. Prove it. Compound it.'}</h2>
        </div>

        <div className="stack-list">
          <article className="stack-item">
            <h3>{isVi ? '1. Nhìn rõ hiện trạng' : '1. See what exists'}</h3>
            <p>{isVi ? 'Kiểm kê node, tài nguyên, trạng thái niềm tin, nhu cầu và bối cảnh mạng lưới.' : 'Inventory nodes, resources, trust status, needs, and network context.'}</p>
          </article>
          <article className="stack-item">
            <h3>{isVi ? '2. Chuẩn hóa điều quan trọng' : '2. Structure what matters'}</h3>
            <p>{isVi ? 'Biến ý định rời rạc thành nhu cầu, đề nghị, khả năng sẵn sàng, tác vụ và đối tượng có thể đặt lịch.' : 'Turn loose intent into requests, offers, availability, tasks, and booking-ready objects.'}</p>
          </article>
          <article className="stack-item">
            <h3>{isVi ? '3. Ghép theo ngữ cảnh' : '3. Match with context'}</h3>
            <p>{isVi ? 'Chấm mức phù hợp theo độ liên quan, niềm tin, thời điểm, năng lực và kết quả vận hành kỳ vọng.' : 'Score fit by relevance, trust, timing, capability, and expected operational outcome.'}</p>
          </article>
          <article className="stack-item">
            <h3>{isVi ? '4. Chuyển sang hành động' : '4. Move to action'}</h3>
            <p>{isVi ? 'Dùng bản nháp AI, nhắn tin, đặt lịch, thanh toán và luồng công việc để hoàn thành tác vụ.' : 'Use AI drafts, messaging, booking, payments, and task flows to complete the work.'}</p>
          </article>
          <article className="stack-item">
            <h3>{isVi ? '5. Lưu bằng chứng và niềm tin' : '5. Store proof and trust'}</h3>
            <p>{isVi ? 'Ghi nhận kết quả để mỗi tương tác hoàn tất đều tăng khả năng được khám phá trong tương lai.' : 'Record outcomes so every completed interaction strengthens future discoverability.'}</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{isVi ? 'Các bề mặt nền tảng' : 'Platform Surfaces'}</p>
          <h2>{isVi ? 'Một thương hiệu chủ cho toàn bộ tầng vận hành' : 'One master brand across the full operating stack'}</h2>
        </div>

        <div className="card-grid">
          <article>
            <h3>omdala.com</h3>
            <p>{isVi ? 'Bề mặt thương hiệu công khai, định vị, onboarding, giải thích niềm tin và định nghĩa danh mục.' : 'Public brand, positioning, onboarding, trust explanation, and category definition.'}</p>
          </article>
          <article>
            <h3>app.omdala.com</h3>
            <p>{isVi ? 'Ứng dụng xác thực cho node, đề nghị, nhu cầu, niềm tin và luồng hành động.' : 'Authenticated application for nodes, offers, requests, trust, and action workflows.'}</p>
          </article>
          <article>
            <h3>docs.omdala.com</h3>
            <p>{isVi ? 'Tài liệu kỹ thuật và sản phẩm cho hợp đồng hệ thống, kiến trúc và API.' : 'Developer and product documentation for system contracts, architecture, and APIs.'}</p>
          </article>
          <article>
            <h3>api.omdala.com</h3>
            <p>{isVi ? 'Lớp API có phiên bản cho định danh, tài nguyên, ghép nối, niềm tin và dịch vụ điều phối.' : 'Versioned API layer for identity, resources, matching, trust, and orchestration services.'}</p>
          </article>
        </div>
      </section>
    </main>
  )
}
