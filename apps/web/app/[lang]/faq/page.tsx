import type { Metadata } from "next"
import { FaqPageView } from "../../faq/FaqPageView"
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
  return buildLocalizedMetadata("faq", language)
}

export default async function LocalizedFaqPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const language = resolveRouteLanguage((await params).lang)
  return <FaqPageView locale={language} />
}
