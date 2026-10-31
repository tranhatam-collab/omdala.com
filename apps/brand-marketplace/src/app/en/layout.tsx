import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MarketplaceNav } from "@/components/MarketplaceNav";
import { rootMetadata } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = rootMetadata("en");

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MarketplaceNav locale="en" />
        {children}
      </body>
    </html>
  );
}
