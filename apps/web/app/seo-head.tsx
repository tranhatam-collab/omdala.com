import { getBreadcrumbSchema, getWebPageSchema, SEO_DEFAULTS, buildLanguageAlternates, buildSeoUrl } from '@omdala/seo'
import { SchemaScript } from '@omdala/ui'

interface SeoHeadProps {
  title: string
  description: string
  path: string
  breadcrumbs: ReadonlyArray<{ readonly name: string; readonly url: string }>
}

export function SeoHead({ title, description, path, breadcrumbs }: SeoHeadProps) {
  const canonical = buildSeoUrl(path)
  const fullTitle = `${title} — ${SEO_DEFAULTS.siteName}`
  const ogImage = SEO_DEFAULTS.ogImage
  const alternates = buildLanguageAlternates(path)
  const schema = [getWebPageSchema({ title: fullTitle, description, path }), getBreadcrumbSchema(breadcrumbs)]

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="en" href={alternates.en} />
      <link rel="alternate" hrefLang="vi" href={alternates.vi} />
      <link rel="alternate" hrefLang="x-default" href={alternates['x-default']} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SEO_DEFAULTS.siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      <SchemaScript id="omdala-page-schema" schema={schema} />
    </>
  )
}
