'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export default function ForHostsPage() {
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
        <p className="eyebrow">{isVi ? 'Dành cho điểm đón' : 'For Hosts'}</p>
        <h1>{isVi ? 'Biến năng lực địa điểm thành mức khai thác chất lượng cao hơn.' : 'Turn place capacity into higher-quality utilization.'}</h1>
        <p className="lead">
          {isVi
            ? 'Điểm đón cần nhiều hơn danh sách hiển thị. Họ cần mức phù hợp, thời điểm, niềm tin và theo đuổi vận hành. OMDALA được thiết kế để cấu trúc toàn bộ vòng lặp đó.'
            : 'Hosts need more than listings. They need fit, timing, trust, and operational follow-through. OMDALA is designed to structure that full loop.'}
        </p>
      </section>

      <section className="panel">
        <ul className="feature-list">
          <li>{isVi ? 'Mô hình hóa không gian, mức sẵn sàng và quy tắc địa điểm thành tài nguyên có cấu trúc.' : 'Model spaces, availability, and place rules as structured resources.'}</li>
          <li>{isVi ? 'Ghép nối theo mức niềm tin, mục tiêu, thời điểm và mức phù hợp vận hành kỳ vọng.' : 'Match against trust level, purpose, timing, and expected operational fit.'}</li>
          <li>{isVi ? 'Dùng bằng chứng và kết quả lịch sử để củng cố các lần đặt lịch tương lai.' : 'Use proofs and historical outcomes to strengthen future bookings.'}</li>
          <li>{isVi ? 'Đi từ yêu cầu đến hành động bằng nhắn tin, tác vụ và trạng thái đặt lịch.' : 'Move from inquiry to action with messaging, tasks, and booking states.'}</li>
        </ul>
      </section>
    </main>
  )
}
