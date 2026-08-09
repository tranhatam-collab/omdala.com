import { notFound } from "next/navigation";
import { validateInquiryType } from "@omdala/brand-core";
import { getListingBySlug } from "@/lib/listings";

const labels = {
  request_info: "Yêu cầu thêm thông tin",
  make_inquiry: "Gửi yêu cầu",
  submit_offer: "Gửi đề nghị",
  request_proof_access: "Yêu cầu quyền xem proof",
  open_deal_room: "Mở deal room",
} as const;

export default async function VietnameseInquiryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ intent?: string }> }) {
  const [{ slug }, { intent }] = await Promise.all([params, searchParams]);
  const listing = getListingBySlug(slug);
  if (!listing) notFound();
  const requestType = intent && validateInquiryType(intent) ? intent : "request_info";
  const workspaceHref = `https://app.omdala.com/brands/${encodeURIComponent(slug)}?intent=${encodeURIComponent(requestType)}`;
  return <main className="market-information" lang="vi"><header><p className="market-eyebrow">Yêu cầu có quản lý / {listing.name}</p><h1>{labels[requestType]}</h1><p className="market-information__lead">Trang công khai này không ghi nhận proof riêng tư và không xử lý thanh toán. Hãy tiếp tục trong workspace có xác thực để bắt đầu yêu cầu.</p></header><div className="market-actions"><a className="market-button market-button--solid" href={workspaceHref}>Tiếp tục tới app.omdala.com</a></div></main>;
}
