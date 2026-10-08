import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InformationPage } from "@/components/InformationPage";
import { getInformationPage, informationPageSlugs } from "@/lib/information-pages";

export function generateStaticParams() { return informationPageSlugs("en").map((page) => ({ page })); }
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  const content = getInformationPage("en", page);
  return content ? { title: content.title, description: content.lead } : { title: "Brand Exchange" };
}

export default async function EnglishInformationRoute({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const content = getInformationPage("en", page);
  if (!content) notFound();
  return <InformationPage locale="en" content={content} />;
}
