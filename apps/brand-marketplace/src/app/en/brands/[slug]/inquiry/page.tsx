import { notFound } from "next/navigation";
import { validateInquiryType } from "@omdala/brand-core";
import { getListingBySlug } from "@/lib/listings";

const labels = {
  request_info: "Request more information",
  make_inquiry: "Make inquiry",
  submit_offer: "Submit offer",
  request_proof_access: "Request proof access",
  open_deal_room: "Open deal room",
} as const;

export default async function InquiryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ intent?: string }> }) {
  const [{ slug }, { intent }] = await Promise.all([params, searchParams]);
  const listing = getListingBySlug(slug);
  if (!listing) notFound();
  const requestType = intent && validateInquiryType(intent) ? intent : "request_info";
  const workspaceHref = `https://app.omdala.com/brands/${encodeURIComponent(slug)}?intent=${encodeURIComponent(requestType)}`;
  return <main className="market-information" lang="en"><header><p className="market-eyebrow">Managed inquiry / {listing.name}</p><h1>{labels[requestType]}</h1><p className="market-information__lead">This public page records no private evidence and handles no payment. Continue in the authenticated workspace to start the managed request.</p></header><div className="market-actions"><a className="market-button market-button--solid" href={workspaceHref}>Continue to app.omdala.com</a></div></main>;
}
