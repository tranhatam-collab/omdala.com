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
        url: "/og-default.svg",
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
  themeColor: "#040816",
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
      </head>
      <body>{children}</body>
    </html>
  );
}
