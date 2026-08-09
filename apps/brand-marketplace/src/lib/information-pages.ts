import type { MarketplaceLocale } from "@/lib/locale";

export interface InformationPage {
  title: string;
  eyebrow: string;
  lead: string;
  sections: Array<{ title: string; body: string; bullets?: string[] }>;
}

const pages: Record<MarketplaceLocale, Record<string, InformationPage>> = {
  en: {
    buy: {
      eyebrow: "Buyer guide",
      title: "Buy a verified digital brand with a clearer boundary.",
      lead: "Each public listing is an approved Brand Package. The exchange shows what is included, what is excluded, and what evidence is summarized before you request access.",
      sections: [
        { title: "1. Compare packages", body: "Review tier, included assets, public verification summary, valuation context, and transfer conditions." },
        { title: "2. Start an inquiry", body: "Request information, make an offer, or ask for proof access. High-value assets never use an instant checkout.", bullets: ["No public sensitive-document gallery", "No automatic legal ownership confirmation", "No public buyer qualification result"] },
        { title: "3. Continue in the workspace", body: "Approved buyer and seller workflows move to app.omdala.com for private proof, deal-room coordination, and transfer tracking." },
      ],
    },
    sell: {
      eyebrow: "Seller guide",
      title: "Private inventory is curated before it is public.",
      lead: "Phase 1 has no public self-upload. Listings are prepared as Brand Packages and must be approved before publication.",
      sections: [
        { title: "Package the asset", body: "Document included and excluded assets, source proof, transfer conditions, and risks before a listing is considered." },
        { title: "Verification before visibility", body: "Verification is displayed as a bounded summary. It does not guarantee revenue, trademark ownership, or return on investment." },
        { title: "Managed transfer", body: "Buyer qualification, detailed proof, legal review, and custody are handled away from the public marketplace." },
      ],
    },
    "verified-assets": {
      eyebrow: "Verification",
      title: "A badge is a bounded claim, not a blanket guarantee.",
      lead: "The marketplace distinguishes domain, codebase, design, seller, trademark, revenue, and manual-deal evidence without exposing sensitive proof files.",
      sections: [
        { title: "What public badges show", body: "A public badge names the evidence category that has been reviewed for the listing scope." },
        { title: "What public badges do not show", body: "They do not disclose private documents, establish legal title automatically, or guarantee commercial outcomes." },
      ],
    },
    "private-inventory": {
      eyebrow: "Phase 1 policy",
      title: "Only approved OMDALA private inventory is listed in Phase 1.",
      lead: "The public catalog does not accept open seller uploads or community submissions during this release stage.",
      sections: [
        { title: "Publication rule", body: "Drafts, KYC/KYB, proof review, and internal approval remain in the authenticated workspace." },
        { title: "Public rule", body: "Only public listing statuses are visible: listed, inquiry open, and under offer." },
      ],
    },
    valuation: {
      eyebrow: "Valuation context",
      title: "Valuation is strategic context, not a market appraisal.",
      lead: "An estimate explains range, confidence, drivers, and risks. It does not replace buyer diligence, legal advice, or an escrow decision.",
      sections: [
        { title: "Range", body: "The range reflects known package assets and operating context, not a guaranteed sale price." },
        { title: "Confidence", body: "Confidence is lower where proof is incomplete, ownership needs review, or commercial performance is unverified." },
      ],
    },
    verification: {
      eyebrow: "Trust boundary",
      title: "Public trust display. Private evidence workflow.",
      lead: "Verification summaries belong on brand.omdala.com; sensitive proof access and transfer execution belong in the authenticated OMDALA workspace.",
      sections: [
        { title: "Public surface", body: "Displays category-level verification labels and explicit asset boundaries." },
        { title: "Private surface", body: "Controls proof access, buyer qualification, operational handoff, and human review." },
      ],
    },
    legal: {
      eyebrow: "Legal boundary",
      title: "This marketplace does not make legal ownership decisions.",
      lead: "Brand packages may include evidence and transfer conditions, but trademark assignment, custody, and legal review are handled through the managed deal workflow.",
      sections: [
        { title: "No public legal conclusion", body: "A domain, codebase, or design badge is not a complete legal-rights opinion." },
        { title: "No automated checkout", body: "There is no automated checkout, auction, or public payment handling in Phase 1." },
      ],
    },
    faq: {
      eyebrow: "Frequently asked questions",
      title: "Answers that keep the boundary clear.",
      lead: "The exchange is a showroom, listing index, trust display, and inquiry surface. It is not a public proof vault or payment processor.",
      sections: [
        { title: "Can I buy instantly?", body: "No. Phase 1 does not provide online checkout, and assets at or above USD 5,000 cannot use Buy Now." },
        { title: "Can I upload a brand?", body: "No. Phase 1 inventory is private and admin-approved." },
        { title: "Where are sensitive documents?", body: "Sensitive proof stays behind the authenticated workflow after an appropriate request is reviewed." },
      ],
    },
    "how-it-works": {
      eyebrow: "Process",
      title: "Browse publicly. Verify privately. Transfer deliberately.",
      lead: "The path is designed to make the public catalog useful without turning it into a payment or proof-vault surface.",
      sections: [
        { title: "1. Browse", body: "Find an approved Brand Package and see its public asset and verification summary." },
        { title: "2. Request", body: "Choose an accountable inquiry or offer path instead of a direct payment action." },
        { title: "3. Execute", body: "Qualified work continues in app.omdala.com with private proof and a documented transfer workflow." },
      ],
    },
  },
  vi: {
    "mua-ban-thuong-hieu": {
      eyebrow: "Hướng dẫn buyer",
      title: "Mua thương hiệu số với ranh giới tài sản rõ ràng.",
      lead: "Mỗi niêm yết công khai là một Brand Package đã được duyệt. Sàn cho biết tài sản bao gồm, không bao gồm và phần tóm tắt xác minh trước khi bạn yêu cầu truy cập.",
      sections: [
        { title: "1. So sánh gói", body: "Xem tier, tài sản đi kèm, tóm tắt xác minh, bối cảnh định giá và điều kiện chuyển nhượng." },
        { title: "2. Gửi yêu cầu", body: "Yêu cầu thông tin, gửi đề nghị hoặc hỏi quyền xem proof. Tài sản giá trị cao không có checkout tức thì." },
        { title: "3. Tiếp tục trong workspace", body: "Luồng buyer/seller được duyệt chuyển sang app.omdala.com để xử lý proof riêng tư và bàn giao." },
      ],
    },
    "ban-thuong-hieu-so": {
      eyebrow: "Hướng dẫn seller",
      title: "Private inventory được chuẩn bị trước khi công khai.",
      lead: "Giai đoạn 1 không có self-upload công khai. Niêm yết được chuẩn bị thành Brand Package và cần duyệt trước khi xuất bản.",
      sections: [
        { title: "Đóng gói tài sản", body: "Ghi rõ tài sản bao gồm, không bao gồm, proof nguồn, điều kiện chuyển nhượng và rủi ro." },
        { title: "Xác minh trước khi hiển thị", body: "Huy hiệu xác minh là tóm tắt có giới hạn; không bảo đảm doanh thu, quyền trademark hay ROI." },
      ],
    },
    "tai-san-thuong-hieu": {
      eyebrow: "Xác minh",
      title: "Huy hiệu là một tuyên bố có giới hạn, không phải cam kết chung.",
      lead: "Marketplace phân biệt evidence về domain, codebase, design, seller, trademark và revenue mà không công khai file proof nhạy cảm.",
      sections: [
        { title: "Huy hiệu công khai thể hiện gì", body: "Huy hiệu nêu loại evidence đã được xem xét trong phạm vi niêm yết." },
        { title: "Huy hiệu công khai không thể hiện gì", body: "Không công khai tài liệu riêng tư, không tự động xác lập quyền sở hữu và không bảo đảm kết quả thương mại." },
      ],
    },
    "chuyen-nhuong-ten-mien-va-thuong-hieu": {
      eyebrow: "Chuyển nhượng",
      title: "Bàn giao được thực hiện có chủ đích, không phải chỉ bằng một nút mua.",
      lead: "Điều kiện chuyển nhượng công khai nêu phạm vi, còn proof nhạy cảm, legal review và custody được xử lý trong workspace xác thực.",
      sections: [
        { title: "Domain và source", body: "Các bước bàn giao phải được ghi nhận và xác nhận trong deal workflow." },
        { title: "Trademark và pháp lý", body: "Không tự suy ra việc chuyển giao trademark từ một huy hiệu hoặc domain." },
      ],
    },
    "cach-hoat-dong": {
      eyebrow: "Quy trình",
      title: "Xem công khai. Xác minh riêng tư. Chuyển nhượng có quản lý.",
      lead: "Luồng được thiết kế để catalog công khai hữu ích mà không biến nó thành nơi thanh toán hoặc proof vault.",
      sections: [
        { title: "1. Khám phá", body: "Xem Brand Package đã duyệt và tóm tắt tài sản, xác minh công khai." },
        { title: "2. Yêu cầu", body: "Bắt đầu bằng inquiry hoặc offer có trách nhiệm thay vì thanh toán trực tiếp." },
        { title: "3. Thực thi", body: "Luồng đủ điều kiện chuyển sang app.omdala.com với proof riêng tư và checklist bàn giao." },
      ],
    },
    "xac-minh": {
      eyebrow: "Ranh giới tin cậy",
      title: "Hiển thị trust công khai. Evidence workflow riêng tư.",
      lead: "Tóm tắt xác minh nằm ở brand.omdala.com; proof nhạy cảm và thực thi chuyển nhượng nằm trong workspace OMDALA có xác thực.",
      sections: [
        { title: "Lớp công khai", body: "Hiển thị nhãn xác minh theo danh mục và ranh giới tài sản rõ ràng." },
        { title: "Lớp riêng tư", body: "Kiểm soát proof access, buyer qualification và human review." },
      ],
    },
    "phap-ly": {
      eyebrow: "Ranh giới pháp lý",
      title: "Marketplace không tự kết luận quyền sở hữu pháp lý.",
      lead: "Brand Package có thể có evidence và điều kiện chuyển nhượng, nhưng trademark assignment, custody và legal review thuộc managed deal workflow.",
      sections: [
        { title: "Không có kết luận pháp lý công khai", body: "Huy hiệu domain, codebase hoặc design không phải là ý kiến đầy đủ về quyền pháp lý." },
        { title: "Không checkout tự động", body: "Giai đoạn 1 không có checkout, auction hay xử lý thanh toán công khai." },
      ],
    },
    "hoi-dap": {
      eyebrow: "Câu hỏi thường gặp",
      title: "Giải đáp nhưng vẫn giữ đúng ranh giới.",
      lead: "Sàn là showroom, listing index, trust display và bề mặt inquiry; không phải public proof vault hay payment processor.",
      sections: [
        { title: "Có thể mua ngay không?", body: "Không. Giai đoạn 1 chưa có checkout; tài sản từ USD 5,000 trở lên không thể dùng Buy Now." },
        { title: "Có thể tự upload thương hiệu không?", body: "Không. Giai đoạn 1 chỉ dùng private inventory do admin duyệt." },
      ],
    },
  },
};

export function getInformationPage(locale: MarketplaceLocale, slug: string): InformationPage | null {
  return pages[locale][slug] ?? null;
}

export function informationPageSlugs(locale: MarketplaceLocale): string[] {
  return Object.keys(pages[locale]);
}
