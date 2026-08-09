import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://brand.omdala.com"),
  title: {
    default: "OMDALA Brand Exchange",
    template: "%s | OMDALA Brand Exchange",
  },
  description: "Approved private inventory for verified digital brand assets.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
