import type { Metadata } from "next"
import { ForExpertsPageView } from "../../for-experts/ForExpertsPageView"
import { buildLocalizedMetadata } from "../../lib/localized-metadata"
import { getPrefixedLocaleStaticParams, resolveRouteLanguage } from "../../lib/locale-routing"

export const dynamicParams = false

export function generateStaticParams() {
  return getPrefixedLocaleStaticParams()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const language = resolveRouteLanguage((await params).lang)
  return buildLocalizedMetadata("forExperts", language)
}

export default async function LocalizedForExpertsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const language = resolveRouteLanguage((await params).lang)
  return <ForExpertsPageView locale={language} />
}
