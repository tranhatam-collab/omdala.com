import type { Metadata, Viewport } from "next";
import { buildRootMetadata, webViewport, WebRootLayout } from "../lib/root-shell";
import { getPrefixedLocaleStaticParams, resolveRouteLanguage } from "../lib/locale-routing";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPrefixedLocaleStaticParams();
}

export const viewport: Viewport = webViewport;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const language = resolveRouteLanguage((await params).lang);
  return buildRootMetadata(language === "vi" ? "vi" : "en");
}

export default async function LocalizedRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const language = resolveRouteLanguage((await params).lang);
  return <WebRootLayout language={language}>{children}</WebRootLayout>;
}
