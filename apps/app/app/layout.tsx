import type { Metadata, Viewport } from 'next'
import { DocumentLanguageSync } from '@omdala/ui'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'OMCode — AI Coding Workspace',
    template: '%s — OMCode',
  },
  description: 'Không gian lập trình AI đầu tiên cho Việt Nam. Viết code, trò chuyện với AI, quản lý dự án và triển khai — tất cả trong một nền tảng.',
  keywords: ['AI coding', 'lập trình AI', 'workspace', 'code editor', 'OMCode', 'OMDALA'],
  openGraph: {
    title: 'OMCode — AI Coding Workspace',
    description: 'Không gian lập trình AI đầu tiên cho Việt Nam.',
    type: 'website',
    locale: 'vi_VN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OMCode — AI Coding Workspace',
    description: 'Không gian lập trình AI đầu tiên cho Việt Nam.',
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://code.omdala.com',
  },
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
            --font-sans: 'SF Pro Display', system-ui, -apple-system, sans-serif;
            --font-mono: 'SFMono-Regular', Consolas, monospace;
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
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
        }}>
          <LanguageSwitcher />
        </div>
        {children}
      </body>
    </html>
  )
}
