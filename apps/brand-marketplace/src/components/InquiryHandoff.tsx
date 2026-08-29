"use client";

import { validateInquiryType } from "@omdala/brand-core";
import { useSearchParams } from "next/navigation";

const copy = {
  en: {
    labels: {
      request_info: "Request more information",
      make_inquiry: "Make inquiry",
      submit_offer: "Submit offer",
      request_proof_access: "Request proof access",
      open_deal_room: "Open deal room",
    },
    eyebrow: "Managed inquiry",
    lead: "This public page records no private evidence and handles no payment. Continue in the authenticated workspace to start the managed request.",
    action: "Continue to app.omdala.com",
  },
  vi: {
    labels: {
      request_info: "Yêu cầu thêm thông tin",
      make_inquiry: "Gửi yêu cầu",
      submit_offer: "Gửi đề nghị",
      request_proof_access: "Yêu cầu quyền xem proof",
      open_deal_room: "Mở deal room",
    },
    eyebrow: "Yêu cầu có quản lý",
    lead: "Trang công khai này không ghi nhận proof riêng tư và không xử lý thanh toán. Hãy tiếp tục trong workspace có xác thực để bắt đầu yêu cầu.",
    action: "Tiếp tục tới app.omdala.com",
  },
} as const;

type InquiryType = keyof (typeof copy)["en"]["labels"];

export function InquiryHandoff({
  appOrigin,
  listingName,
  locale,
  slug,
}: {
  appOrigin: string;
  listingName: string;
  locale: keyof typeof copy;
  slug: string;
}) {
  const intent = useSearchParams().get("intent");
  const requestType: InquiryType =
    intent && validateInquiryType(intent) ? intent : "request_info";

  return (
    <InquiryHandoffView
      appOrigin={appOrigin}
      listingName={listingName}
      locale={locale}
      requestType={requestType}
      slug={slug}
    />
  );
}

export function InquiryHandoffFallback(
  props: Omit<React.ComponentProps<typeof InquiryHandoffView>, "requestType">,
) {
  return <InquiryHandoffView {...props} requestType="request_info" />;
}

function InquiryHandoffView({
  appOrigin,
  listingName,
  locale,
  requestType,
  slug,
}: {
  appOrigin: string;
  listingName: string;
  locale: keyof typeof copy;
  requestType: InquiryType;
  slug: string;
}) {

  const text = copy[locale];
  const workspaceHref = `${appOrigin}/brands/${encodeURIComponent(slug)}?intent=${encodeURIComponent(requestType)}`;

  return (
    <main className="market-information" lang={locale}>
      <header>
        <p className="market-eyebrow">
          {text.eyebrow} / {listingName}
        </p>
        <h1>{text.labels[requestType]}</h1>
        <p className="market-information__lead">{text.lead}</p>
      </header>
      <div className="market-actions">
        <a className="market-button market-button--solid" href={workspaceHref}>
          {text.action}
        </a>
      </div>
    </main>
  );
}
