import type { Metadata } from 'next'
import { HomePageView } from '../HomePageView'
import { buildLocalizedMetadata } from '../lib/localized-metadata'
import { getPrefixedLocaleStaticParams, resolveRouteLanguage } from '../lib/locale-routing'

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
  return buildLocalizedMetadata('home', language)
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const language = resolveRouteLanguage((await params).lang)
  return <HomePageView locale={language} />
}
