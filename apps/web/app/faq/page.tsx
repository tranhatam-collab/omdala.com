'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

const FAQS = {
  en: [
    {
      question: 'Is OMDALA a marketplace?',
      answer:
        'Not primarily. Marketplace behavior can exist inside the system, but OMDALA is broader: it handles identity, trust, matching, action, and proof.',
    },
    {
      question: 'Is OMDALA only for AI workflows?',
      answer:
        'No. AI is a support layer for planning and orchestration. The product is ultimately about real operational outcomes.',
    },
    {
      question: 'Who should use it first?',
      answer:
        'Operators with real capacity to activate: experts, hosts, communities, and small business nodes.',
    },
    {
      question: 'Why is trust central?',
      answer:
        'Because weak trust destroys matching quality, discoverability, and repeat outcomes faster than feature gaps do.',
    },
  ],
  vi: [
    {
      question: 'OMDALA có phải là marketplace không?',
      answer:
        'Không phải trọng tâm chính. Hành vi marketplace có thể tồn tại trong hệ thống, nhưng OMDALA rộng hơn: xử lý định danh, niềm tin, ghép nối, hành động và bằng chứng.',
    },
    {
      question: 'OMDALA chỉ dành cho workflow AI?',
      answer:
        'Không. AI là lớp hỗ trợ cho lập kế hoạch và điều phối. Giá trị cốt lõi vẫn là kết quả vận hành thực tế.',
    },
    {
      question: 'Ai nên dùng trước?',
      answer:
        'Những người vận hành có năng lực thật để kích hoạt: chuyên gia, điểm đón, cộng đồng và các node doanh nghiệp nhỏ.',
    },
    {
      question: 'Vì sao niềm tin là trung tâm?',
      answer:
        'Vì niềm tin yếu sẽ phá chất lượng ghép nối, khả năng khám phá và kết quả lặp lại nhanh hơn nhiều so với thiếu tính năng.',
    },
  ],
} as const

export default function FaqPage() {
  const [isVi, setIsVi] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsVi(resolveLanguage(new URLSearchParams(window.location.search).get('lang')) === 'vi')
  }, [])
  const localizedFaqs = isVi ? FAQS.vi : FAQS.en

  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">FAQ</p>
        <h1>{isVi ? 'Trả lời rõ ràng trước khi hệ thống mở rộng.' : 'Clear answers before the build expands.'}</h1>
        <p className="lead">
          {isVi
            ? 'Cách nhanh nhất để giữ nền tảng đi đúng hướng là trả lời các câu hỏi về danh mục và hệ thống từ sớm, nhất quán.'
            : 'The fastest way to keep the platform aligned is to answer the category and system questions early and consistently.'}
        </p>
      </section>

      <section className="panel">
        <div className="faq-grid">
          {localizedFaqs.map((faq) => (
            <article key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
