import type { Metadata } from "next";
import { ListingCard } from "@/components/ListingCard";
import { getListings } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Tất cả thương hiệu đã duyệt",
  description: "Xem private inventory thương hiệu số đã được duyệt.",
};

export default function VietnameseBrandsPage() {
  const listings = getListings();
  return (
    <main className="market-information" lang="vi">
      <header><p className="market-eyebrow">Private inventory đã duyệt</p><h1>Gói thương hiệu với ranh giới bàn giao rõ ràng.</h1><p className="market-information__lead">Mỗi niêm yết công khai nêu tier, phạm vi tài sản và tóm tắt xác minh. Evidence nhạy cảm vẫn ở lớp riêng tư.</p></header>
      <div className="listing-grid market-listing-index">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} locale="vi" />)}</div>
    </main>
  );
}
