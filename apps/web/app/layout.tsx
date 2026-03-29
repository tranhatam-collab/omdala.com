import type { Metadata, Viewport } from 'next'
import { getOrganizationSchema, getWebSiteSchema } from '@omdala/seo'
import { SchemaScript } from '@omdala/ui'
import { WebChrome } from './WebChrome'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://omdala.com'),
  title: {
    default:  'OMDALA — The Operating Layer for Real-World Value',
    template: '%s — OMDALA',
  },
  description:
    'OMDALA is the global operating layer for real-world value, trust, and intelligent coordination.',
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

export const viewport: Viewport = {
  themeColor:   '#040816',
  colorScheme:  'dark',
  width:        'device-width',
  initialScale: 1,
}

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
