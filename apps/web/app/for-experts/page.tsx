'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export default function ForExpertsPage() {
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
        <p className="eyebrow">{isVi ? 'Dành cho chuyên gia' : 'For Experts'}</p>
        <h1>{isVi ? 'Biến chuyên môn thành cơ hội có cấu trúc và đáng tin.' : 'Turn expertise into structured, trusted opportunity.'}</h1>
        <p className="lead">
          {isVi
            ? 'OMDALA giúp chuyên gia, cố vấn, nhà sáng tạo và người vận hành đóng gói thời gian, tri thức và uy tín thành đề nghị, nhu cầu và luồng công việc lặp lại dựa trên niềm tin.'
            : 'OMDALA helps specialists, advisors, creators, and operators package time, knowledge, and credibility into offers, requests, and repeatable trust-backed workflows.'}
        </p>
      </section>

      <section className="panel">
        <div className="card-grid">
          <article>
            <h3>{isVi ? 'Đóng gói giá trị của bạn' : 'Package your value'}</h3>
            <p>{isVi ? 'Chuyển chuyên môn, mức sẵn sàng và mục tiêu thành đề nghị rõ ràng và đối tượng vận hành.' : 'Convert expertise, availability, and goals into clear offers and operational objects.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Nâng chất lượng tín hiệu' : 'Improve signal quality'}</h3>
            <p>{isVi ? 'Dùng bằng chứng, xác thực và lịch sử hoàn thành để tăng độ tin cậy khi được khám phá.' : 'Use proof, verification, and completion history to make discovery more trustworthy.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Hành động nhanh hơn' : 'Act faster'}</h3>
            <p>{isVi ? 'Đi từ ý tưởng đến tiếp cận, đặt lịch, định giá và danh sách tác vụ với hỗ trợ AI.' : 'Move from idea to outreach, booking, pricing, and task lists with AI support.'}</p>
          </article>
        </div>
      </section>
    </main>
  )
}
