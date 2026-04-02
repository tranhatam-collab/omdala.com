'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export default function ApiDocsPage() {
  const [isVi, setIsVi] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsVi(resolveLanguage(new URLSearchParams(window.location.search).get('lang')) === 'vi')
  }, [])

  return (
    <main>
      <h1>{isVi ? 'Tham chiếu API OMDALA' : 'OMDALA API Reference'}</h1>
      <p>
        {isVi ? (
          <>
            API chủ được phiên bản hóa dưới <code>/v1</code> và nhóm route theo định danh, tài
            nguyên, đề nghị, nhu cầu, ghép nối, hội thoại, đặt lịch, thanh toán, bằng chứng, niềm
            tin và tác vụ admin.
          </>
        ) : (
          <>
            The master API is versioned under <code>/v1</code> and groups routes by identity,
            resources, offers, requests, matches, conversations, bookings, payments, proofs, trust,
            and admin actions.
          </>
        )}
      </p>
    </main>
  )
}
