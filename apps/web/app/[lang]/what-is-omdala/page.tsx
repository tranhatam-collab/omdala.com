import type { Metadata } from "next"
import { WhatIsOmdalaPageView } from "../../what-is-omdala/WhatIsOmdalaPageView"
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
  return buildLocalizedMetadata("whatIsOmdala", language)
}

export default async function LocalizedWhatIsOmdalaPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const language = resolveRouteLanguage((await params).lang)
  return <WhatIsOmdalaPageView locale={language} />
}
