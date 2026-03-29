'use client'

import { resolveLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'
import { LocaleLink } from './components/LocaleLink'

export default function DocsHomePage() {
  const [isVi, setIsVi] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setIsVi(resolveLanguage(new URLSearchParams(window.location.search).get('lang')) === 'vi')
  }, [])

  return (
    <main>
      <h1>{isVi ? 'Tài liệu OMDALA' : 'OMDALA Documentation'}</h1>
      <p>{isVi ? 'Hướng dẫn nền tảng, tham chiếu API, logic niềm tin và kiến trúc hệ thống.' : 'Platform guides, API reference, trust logic, and system architecture.'}</p>
      <nav>
        <LocaleLink href="/platform">{isVi ? 'Tổng quan nền tảng' : 'Platform overview'}</LocaleLink>
        <LocaleLink href="/api">{isVi ? 'Tham chiếu API' : 'API reference'}</LocaleLink>
        <LocaleLink href="/trust">{isVi ? 'Hệ thống niềm tin' : 'Trust system'}</LocaleLink>
      </nav>
    </main>
  )
}
