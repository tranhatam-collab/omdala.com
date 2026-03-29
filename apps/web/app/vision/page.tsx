'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export default function VisionPage() {
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
        <p className="eyebrow">{isVi ? 'Tầm nhìn dài hạn' : 'Long-Term Vision'}</p>
        <h1>{isVi ? 'Thiết kế đủ gọn để ra mắt, đủ vững để có ý nghĩa trong nhiều thập kỷ.' : 'Design narrow enough to launch, strong enough to matter for decades.'}</h1>
        <p className="lead">
          {isVi
            ? 'OMDALA nên bắt đầu bằng tính hữu dụng vận hành sắc nét, nhưng kiến trúc phải đủ khả năng phát triển thành lớp điều phối con người bền vững dựa trên niềm tin qua nhiều lĩnh vực.'
            : 'OMDALA should start with sharp operational usefulness, but the architecture must be able to grow into a durable layer for trust-backed human coordination across many domains.'}
        </p>
      </section>

      <section className="panel">
        <div className="stack-list">
          <article className="stack-item">
            <h3>{isVi ? 'Tầm nhìn 10 năm' : '10-year horizon'}</h3>
            <p>{isVi ? 'Trở thành hạ tầng không thể thiếu cho chuyên gia, điểm đón, cộng đồng và các node doanh nghiệp nhỏ.' : 'Become indispensable for experts, hosts, communities, and small business nodes.'}</p>
          </article>
          <article className="stack-item">
            <h3>{isVi ? 'Tầm nhìn 25 năm' : '25-year horizon'}</h3>
            <p>{isVi ? 'Vận hành như hạ tầng chung cho mạng lưới phân tán, tài sản và kinh tế địa phương.' : 'Operate as shared infrastructure for distributed networks, assets, and local economies.'}</p>
          </article>
          <article className="stack-item">
            <h3>{isVi ? 'Tầm nhìn 100 năm' : '100-year horizon'}</h3>
            <p>{isVi ? 'Duy trì giá trị vì niềm tin, điều phối, bằng chứng và kích hoạt tài nguyên là nhu cầu bền vững.' : 'Remain valuable because trust, coordination, proof, and resource activation are durable needs.'}</p>
          </article>
        </div>
      </section>
    </main>
  )
}
