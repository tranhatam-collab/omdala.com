'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'

export default function PlatformDocsPage() {
  const [isVi, setIsVi] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsVi(resolveLanguage(new URLSearchParams(window.location.search).get('lang')) === 'vi')
  }, [])

  return (
    <main>
      <h1>{isVi ? 'Tổng quan nền tảng OMDALA' : 'OMDALA Platform Overview'}</h1>
      <p>
        {isVi
          ? 'OMDALA là lớp nền tảng chủ cho định danh, tài nguyên, ghép nối, niềm tin, điều phối có AI hỗ trợ và thực thi thực tế trên các bề mặt web công khai, app, API, docs và admin.'
          : 'OMDALA is the master platform layer for identity, resources, matching, trust, AI-assisted orchestration, and real-world execution across public web, app, API, docs, and admin surfaces.'}
      </p>
    </main>
  )
}
