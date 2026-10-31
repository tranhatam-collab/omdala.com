import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
import { MarketplaceHome } from "@/components/MarketplaceHome";

export const metadata: Metadata = { alternates: localizedAlternates("vi", "/") };

export default function VietnameseHomePage() {
  return <MarketplaceHome locale="vi" />;
}
