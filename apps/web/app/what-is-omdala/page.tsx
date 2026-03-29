'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export default function WhatIsOmdalaPage() {
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
        <p className="eyebrow">{isVi ? 'Định nghĩa' : 'Definition'}</p>
        <h1>{isVi ? 'OMDALA là lớp nền tảng chủ để điều phối giá trị.' : 'OMDALA is the master platform layer for coordinated value.'}</h1>
        <p className="lead">
          {isVi
            ? 'Đây không phải trang du lịch, sàn giao dịch chung chung hay lớp AI trang trí. Đây là lớp vận hành giúp định danh, tài nguyên, niềm tin và hành động phối hợp với nhau.'
            : 'It is not a tourism site, a generic marketplace, or a decorative AI wrapper. It is the operating layer that makes identity, resources, trust, and action work together.'}
        </p>
      </section>

      <section className="panel">
        <div className="card-grid">
          <article>
            <h3>{isVi ? 'Đây là gì' : 'What it is'}</h3>
            <p>{isVi ? 'Một nền tảng điều phối con người, địa điểm, tổ chức, tài nguyên và kết quả.' : 'A platform for coordinating people, places, organizations, resources, and outcomes.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Không phải gì' : 'What it is not'}</h3>
            <p>{isVi ? 'Không phải newsfeed ồn ào, danh bạ mỏng, ứng dụng một tính năng hay chatbot AI không vai trò hệ thống.' : 'A noisy feed, a thin directory, a one-feature app, or an AI chatbot with no system role.'}</p>
          </article>
          <article>
            <h3>{isVi ? 'Vị trí của nó' : 'Where it sits'}</h3>
            <p>{isVi ? 'Ở tầng thương hiệu chủ: các bề mặt web, app, API, docs, trust và admin đều xuất phát từ đây.' : 'At the masterbrand level: web, app, API, docs, trust, and admin surfaces all flow from it.'}</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">{isVi ? 'Các lớp cốt lõi' : 'Core Layers'}</p>
          <h2>{isVi ? 'Nền tảng được thiết kế gồm 5 lớp phối hợp' : 'The platform is designed as five layers working together'}</h2>
        </div>
        <ul className="feature-list">
          <li>{isVi ? 'Định danh: node, vai trò, quyền sở hữu, mức hiển thị và nền niềm tin.' : 'Identity: nodes, roles, ownership, visibility, and trust baseline.'}</li>
          <li>{isVi ? 'Tài nguyên: thời gian, không gian, kỹ năng, tri thức, năng lực và tài sản nhàn rỗi.' : 'Resources: time, space, skill, knowledge, capacity, and underused assets.'}</li>
          <li>{isVi ? 'Điều phối: đề nghị, nhu cầu, ghép nối, nhắn tin, đặt lịch và tác vụ.' : 'Coordination: offers, requests, matching, messaging, bookings, and tasks.'}</li>
          <li>{isVi ? 'Niềm tin: xác thực, bằng chứng, hành vi, quản trị và uy tín có thể giải thích.' : 'Trust: verification, proof, behavior, governance, and explainable reputation.'}</li>
          <li>{isVi ? 'Trí tuệ: lập kế hoạch AI, điều phối, ưu tiên và hỗ trợ hành động.' : 'Intelligence: AI planning, orchestration, prioritization, and action support.'}</li>
        </ul>
      </section>
    </main>
  )
}
