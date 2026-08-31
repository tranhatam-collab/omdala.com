import type { Metadata } from "next"
import { ForHostsPageView } from "../../for-hosts/ForHostsPageView"
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
  return buildLocalizedMetadata("forHosts", language)
}

export default async function LocalizedForHostsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const language = resolveRouteLanguage((await params).lang)
  return <ForHostsPageView locale={language} />
}
