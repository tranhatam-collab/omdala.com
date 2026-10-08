import type { ReactNode } from "react";
import { MarketplaceNav } from "@/components/MarketplaceNav";

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <><MarketplaceNav locale="en" />{children}</>;
}
