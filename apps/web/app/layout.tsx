import type { Metadata, Viewport } from "next";
import { getOrganizationSchema, getWebSiteSchema } from "@omdala/seo";
import { SchemaScript } from "@omdala/ui";
import { getPageCopy } from "./lib/bilingual-source";
import "./globals.css";

const homeSeo = getPageCopy("home", "en");

export const metadata: Metadata = {
  metadataBase: new URL("https://omdala.com"),
  title: {
    default: `OMDALA — ${homeSeo.seoTitle}`,
    template: "%s — OMDALA",
  },
  description: homeSeo.seoDescription,
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      vi: "/vi",
      "x-default": "/",
    },
  },
  openGraph: {
    siteName: "OMDALA",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: `OMDALA — ${homeSeo.seoTitle}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#060d1a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <SchemaScript
          id="omdala-root-schema"
          schema={[getOrganizationSchema(), getWebSiteSchema()]}
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
      <body>{children}</body>
    </html>
  );
}
