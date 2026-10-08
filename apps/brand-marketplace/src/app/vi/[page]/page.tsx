import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InformationPage } from "@/components/InformationPage";
import { getInformationPage, informationPageSlugs } from "@/lib/information-pages";

export function generateStaticParams() { return informationPageSlugs("vi").map((page) => ({ page })); }
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  const content = getInformationPage("vi", page);
  return content ? { title: content.title, description: content.lead } : { title: "OMDALA Brand Exchange" };
}

export default async function VietnameseInformationRoute({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const content = getInformationPage("vi", page);
  if (!content) notFound();
  return <InformationPage locale="vi" content={content} />;
}
