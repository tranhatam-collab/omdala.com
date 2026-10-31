import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
import { MarketplaceHome } from "@/components/MarketplaceHome";

export const metadata: Metadata = { alternates: localizedAlternates("en", "/") };

export default function EnglishHomePage() {
  return <MarketplaceHome locale="en" />;
}
