import type { Metadata, Viewport } from "next";
import { buildRootMetadata, webViewport, WebRootLayout } from "../lib/root-shell";

export const metadata: Metadata = buildRootMetadata("en");
export const viewport: Viewport = webViewport;

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return <WebRootLayout language="en">{children}</WebRootLayout>;
}
