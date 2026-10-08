import type { ReactNode } from "react";
import { MarketplaceNav } from "@/components/MarketplaceNav";

export default function VietnameseLayout({ children }: { children: ReactNode }) {
  return <><MarketplaceNav locale="vi" />{children}</>;
}
