'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export default function TrustDocsPage() {
  const [isVi, setIsVi] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsVi(resolveLanguage(new URLSearchParams(window.location.search).get('lang')) === 'vi')
  }, [])

  return (
    <main>
      <h1>{isVi ? 'Hệ thống niềm tin OMDALA' : 'OMDALA Trust System'}</h1>
      <p>
        {isVi
          ? 'Niềm tin trong OMDALA được xây từ xác thực, bằng chứng, mức hoàn thành, hành vi, lịch sử kinh tế và tín hiệu quản trị. Hệ thống được thiết kế để có thể giải thích, kiểm toán và gắn chặt với hành động.'
          : 'Trust in OMDALA is derived from verification, proof, completion, behavior, economic history, and governance signals. It is designed to be explainable, auditable, and action-relevant.'}
      </p>
    </main>
  )
}
