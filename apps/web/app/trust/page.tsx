'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export default function TrustPage() {
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
        <p className="eyebrow">{isVi ? 'Niềm tin theo thiết kế' : 'Trust by Design'}</p>
        <h1>{isVi ? 'Niềm tin là hạ tầng, không phải trang trí.' : 'Trust is infrastructure, not decoration.'}</h1>
        <p className="lead">
          {isVi
            ? 'OMDALA không rút gọn niềm tin thành sao đánh giá cảm tính. Hệ thống xem niềm tin là cấu trúc được xây từ bằng chứng, hành vi, mức hoàn thành, quản trị và quy tắc hiển thị có thể giải thích.'
            : 'OMDALA does not reduce trust to stars and vibes. It treats trust as a system built from evidence, behavior, completion, governance, and explainable visibility rules.'}
        </p>
      </section>

      <section className="panel">
        <div className="card-grid">
          <article>
            <h3>{isVi ? 'Xác thực' : 'Verification'}</h3>
            <p>{isVi ? 'Định danh, quyền sở hữu, thanh toán, liên kết và các kiểm tra sự thật khi phù hợp.' : 'Identity, ownership, payment, affiliation, and other factual checks where appropriate.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Bằng chứng' : 'Proof'}</h3>
            <p>{isVi ? 'Biên nhận, xác nhận, đầu ra, điểm danh, bàn giao và bằng chứng hoàn thành.' : 'Receipts, confirmations, outputs, attendance, delivery, and completion evidence.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Hành vi' : 'Behavior'}</h3>
            <p>{isVi ? 'Chất lượng phản hồi, độ tin cậy, mẫu hủy, lịch sử tranh chấp và khả năng theo đuổi.' : 'Response quality, reliability, cancellation patterns, dispute history, and follow-through.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Quản trị' : 'Governance'}</h3>
            <p>{isVi ? 'Cảnh báo, ghi đè, hành động kiểm duyệt và dấu vết kiểm toán cho quyết định nhạy cảm.' : 'Warnings, overrides, moderation actions, and audit trails for sensitive decisions.'}</p>
          </article>
        </div>
      </section>
    </main>
  )
}
