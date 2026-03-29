'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export default function HowItWorksPage() {
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
        <p className="eyebrow">{isVi ? 'Logic hệ thống' : 'System Logic'}</p>
        <h1>{isVi ? 'OMDALA vận hành bằng cách biến năng lực ẩn thành hành động có cấu trúc.' : 'OMDALA works by turning hidden capacity into structured action.'}</h1>
        <p className="lead">
          {isVi
            ? 'Nền tảng xoay quanh một vòng lặp tích lũy: thấy rõ hiện trạng, ghép đúng đối tượng, chuyển sang hành động, lưu bằng chứng và cải thiện kết quả tương lai.'
            : 'The platform is built around one compounding loop: see what exists, match the right fit, move to action, store proof, and improve future outcomes.'}
        </p>
      </section>

      <section className="panel">
        <div className="stack-list">
          <article className="stack-item">
            <h3>{isVi ? '1. Lập bản đồ node' : '1. Map the node'}</h3>
            <p>{isVi ? 'Ghi nhận định danh, mục tiêu, vai trò, mức sẵn sàng, tài sản và trạng thái niềm tin hiện tại.' : 'Capture identity, goals, roles, availability, assets, and current trust state.'}</p>
          </article>
          <article className="stack-item">
            <h3>{isVi ? '2. Chuẩn hóa tài nguyên' : '2. Normalize the resource'}</h3>
            <p>{isVi ? 'Biến thông tin rời rạc thành đối tượng tài nguyên, đề nghị, nhu cầu và trạng thái vận hành.' : 'Turn loose information into resource objects, offers, requests, and operational states.'}</p>
          </article>
          <article className="stack-item">
            <h3>{isVi ? '3. Chấm điểm phù hợp' : '3. Score the fit'}</h3>
            <p>{isVi ? 'Dùng tín hiệu ghép nối như niềm tin, thời điểm, mức liên quan, địa phương, năng lực và ý định.' : 'Use matching signals such as trust, timing, relevance, locality, capacity, and intent.'}</p>
          </article>
          <article className="stack-item">
            <h3>{isVi ? '4. Chuyển thành thực thi' : '4. Convert to execution'}</h3>
            <p>{isVi ? 'Soạn nhắn tin, tạo tác vụ, mở đặt lịch và dẫn dắt theo đuổi với hỗ trợ AI.' : 'Draft messages, create tasks, open bookings, and guide follow-through with AI assistance.'}</p>
          </article>
          <article className="stack-item">
            <h3>{isVi ? '5. Ghi nhận bằng chứng' : '5. Record proof'}</h3>
            <p>{isVi ? 'Gắn biên nhận, xác nhận, đầu ra, bảo chứng và tạo tác xác thực.' : 'Attach receipts, confirmations, outputs, endorsements, and verification artifacts.'}</p>
          </article>
          <article className="stack-item">
            <h3>{isVi ? '6. Tích lũy niềm tin' : '6. Compound trust'}</h3>
            <p>{isVi ? 'Dùng kết quả để tăng khả năng khám phá, giảm rủi ro và nâng chất lượng cơ hội tương lai.' : 'Use outcomes to increase discoverability, reduce risk, and improve future opportunity quality.'}</p>
          </article>
        </div>
      </section>
    </main>
  )
}
