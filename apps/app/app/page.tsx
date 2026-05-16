'use client'

import { AUTH_ENTRY_LINKS } from '@omdala/core'
import { pickLanguageValue, resolveLanguage, type OmdalaLanguage } from '@omdala/core'
import { useEffect, useState } from 'react'
import { LocaleLink } from './components/LocaleLink'

const COPY = {
  eyebrow: {
    en: 'Authenticated Surface',
    vi: 'Bề mặt xác thực',
    zh: '认证界面',
    es: 'Superficie autenticada',
    ja: '認証済みサーフェス',
    ko: '인증된 화면',
  },
  description: {
    en: 'This surface is for logged-in operators working with nodes, resources, trust, and action flows. Use the auth entry points below to continue the next build phase.',
    vi: 'Khu vực này dành cho người vận hành đã đăng nhập, làm việc với các nút, tài nguyên, niềm tin và luồng hành động. Hãy dùng các điểm vào xác thực bên dưới để tiếp tục giai đoạn triển khai tiếp theo.',
    zh: '该界面面向已登录的运营人员，用于处理节点、资源、信任与行动流。请使用下方认证入口继续下一阶段构建。',
    es: 'Esta superficie es para operadores autenticados que trabajan con nodos, recursos, confianza y flujos de acción. Usa los accesos de autenticación de abajo para continuar la siguiente fase.',
    ja: 'この画面は、ノード、リソース、信頼、アクションフローを扱うログイン済みオペレーター向けです。次のビルド段階に進むには下記の認証入口を使ってください。',
    ko: '이 화면은 노드, 리소스, 신뢰, 액션 플로우를 다루는 로그인 운영자를 위한 공간입니다. 다음 빌드 단계로 진행하려면 아래 인증 진입점을 사용하세요.',
  },
  login: {
    en: 'Log in',
    vi: 'Đăng nhập',
    zh: '登录',
    es: 'Iniciar sesión',
    ja: 'ログイン',
    ko: '로그인',
  },
  signup: {
    en: 'Create account',
    vi: 'Tạo tài khoản',
    zh: '创建账户',
    es: 'Crear cuenta',
    ja: 'アカウント作成',
    ko: '계정 만들기',
  },
  openDashboard: {
    en: 'Open dashboard shell',
    vi: 'Mở bảng điều khiển',
    zh: '打开仪表板外壳',
    es: 'Abrir shell del panel',
    ja: 'ダッシュボードを開く',
    ko: '대시보드 열기',
  },
  backToWeb: {
    en: 'Back to omdala.com',
    vi: 'Quay về omdala.com',
    zh: '返回 omdala.com',
    es: 'Volver a omdala.com',
    ja: 'omdala.com に戻る',
    ko: 'omdala.com으로 돌아가기',
  },
} as const

export default function AppPage() {
  const [language, setLanguage] = useState<OmdalaLanguage>('en')
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setLanguage(resolveLanguage(new URLSearchParams(window.location.search).get('lang')))
  }, [])

  return (
    <main className="app-shell auth-shell">
      <section className="auth-card">
        <p className="app-eyebrow">{pickLanguageValue(language, COPY.eyebrow)}</p>
        <h1>OMDALA App</h1>
        <p className="app-copy">
          {pickLanguageValue(language, COPY.description)}
        </p>

        <div className="app-button-row">
          {AUTH_ENTRY_LINKS.map((item) => (
            <LocaleLink key={item.href} href={item.href} className="app-button app-button--primary">
              {item.label === 'Log in'
                ? pickLanguageValue(language, COPY.login)
                : pickLanguageValue(language, COPY.signup)}
            </LocaleLink>
          ))}
        </div>

        <div className="auth-helper-links">
          <LocaleLink href="/dashboard">{pickLanguageValue(language, COPY.openDashboard)}</LocaleLink>
          <a href="https://omdala.com">{pickLanguageValue(language, COPY.backToWeb)}</a>
        </div>
      </section>
    </main>
  )
}
