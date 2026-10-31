import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MarketplaceNav } from "@/components/MarketplaceNav";
import { rootMetadata } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = rootMetadata("vi");

export default function VietnameseLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <MarketplaceNav locale="vi" />
        {children}
      </body>
    </html>
  );
}
