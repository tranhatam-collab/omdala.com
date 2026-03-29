'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export default function ForCommunitiesPage() {
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
        <p className="eyebrow">{isVi ? 'Dành cho cộng đồng' : 'For Communities'}</p>
        <h1>{isVi ? 'Vận hành nhóm, tài sản và quản trị rõ ràng hơn.' : 'Run groups, assets, and governance with more clarity.'}</h1>
        <p className="lead">
          {isVi
            ? 'Cộng đồng mạnh hơn khi tài nguyên chung, vai trò, bằng chứng và điều phối nằm trong một hệ thống thống nhất thay vì các luồng rời rạc và xử lý thủ công.'
            : 'Communities become stronger when shared resources, roles, proof, and coordination live in one calm system instead of fragmented threads and manual workarounds.'}
        </p>
      </section>

      <section className="panel">
        <div className="card-grid">
          <article>
            <h3>{isVi ? 'Tài nguyên dùng chung' : 'Shared resources'}</h3>
            <p>{isVi ? 'Theo dõi tài sản, mức sẵn sàng, sự kiện và trách nhiệm trong toàn nhóm.' : 'Track assets, availability, events, and responsibilities across the group.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Niềm tin thành viên' : 'Member trust'}</h3>
            <p>{isVi ? 'Xây dựng độ tin cậy nhìn thấy được qua bằng chứng, mức tham gia, lịch sử vai trò và nhật ký quản trị.' : 'Build visible reliability through proof, participation, role history, and governance logs.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Bộ nhớ vận hành' : 'Operational memory'}</h3>
            <p>{isVi ? 'Giữ hành động cộng đồng có thể kiểm toán để tri thức giá trị không biến mất trong luồng chat.' : 'Keep community actions auditable so valuable knowledge does not disappear into chat.'}</p>
          </article>
        </div>
      </section>
    </main>
  )
}
