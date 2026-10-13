import type { Metadata, Viewport } from 'next'
import { getOrganizationSchema, getWebSiteSchema } from '@omdala/seo'
import { OMDALA_VIEWPORT, SchemaScript } from '@omdala/ui'
import { WebChrome } from './WebChrome'
import '@omdala/ui/styles/tokens.css'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://omdala.com'),
  title: {
    default:  'OMDALA — The Operating Layer for Real-World Value',
    template: '%s — OMDALA',
  },
  description:
    'OMDALA is the global operating layer for real-world value, trust, and intelligent coordination.',
  alternates: {
    canonical: '/',
    languages: {
      'en': '/',
      'vi': '/?lang=vi',
      'zh': '/?lang=zh',
      'es': '/?lang=es',
      'ja': '/?lang=ja',
      'ko': '/?lang=ko',
      'x-default': '/',
    },
  },
  openGraph: {
    siteName: 'OMDALA',
    type:     'website',
    locale:   'en_US',
    images: [
      {
        url:    '/og-default.svg',
        width:  1200,
        height: 630,
        alt:    'OMDALA — The Operating Layer for Real-World Value',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export const viewport: Viewport = OMDALA_VIEWPORT

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <SchemaScript
          id="omdala-root-schema"
          schema={[
            getOrganizationSchema(),
            getWebSiteSchema(),
          ]}
        />
      </head>
      <body><WebChrome>{children}</WebChrome></body>
    </html>
  )
}
