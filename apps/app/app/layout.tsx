import type { Metadata, Viewport } from 'next'
import { DocumentLanguageSync } from '@omdala/ui'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'OMDALA App',
    template: '%s — OMDALA App',
  },
  description: 'Hệ sinh thái thông minh cho cộng đồng và doanh nghiệp.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#060d1a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --om-midnight: #060d1a;
            --om-deep: #0a1628;
            --om-surface: #0f1d33;
            --om-surface-hi: #152440;
            --om-elevated: #1a2e4d;
            --om-accent: #7ef2ff;
            --om-accent-soft: #a8f5ff;
            --om-success: #4ade80;
            --om-warning: #fbbf24;
            --om-danger: #f87171;
            --om-info: #60a5fa;
            --om-text: #f7fbff;
            --om-text-secondary: #a8b9d0;
            --om-text-muted: #6b7f99;
            --om-border: rgba(255,255,255,0.08);
            --om-border-focus: rgba(126,242,255,0.4);
            --om-glow: 0 0 20px rgba(126,242,255,0.15);
            --font-sans: 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif;
            --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
          }
          body {
            font-family: var(--font-sans);
            background: var(--om-midnight);
            color: var(--om-text);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(126,242,255,0.15) transparent;
          }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb {
            background: rgba(126,242,255,0.15);
            border-radius: 999px;
          }
        `}</style>
      </head>
      <body>
        <DocumentLanguageSync />
        <div className="app-shell app-layout-topbar">
          <LanguageSwitcher />
        </div>
        {children}
      </body>
    </html>
  )
}
