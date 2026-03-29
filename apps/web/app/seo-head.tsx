import { getBreadcrumbSchema, getWebPageSchema, SEO_DEFAULTS } from '@omdala/seo'

interface SeoHeadProps {
  title: string
  description: string
  path: string
  breadcrumbs: ReadonlyArray<{ readonly name: string; readonly url: string }>
}

export function SeoHead({ title, description, path, breadcrumbs }: SeoHeadProps) {
  const canonical = `${SEO_DEFAULTS.baseUrl}${path}`
  const fullTitle = `${title} — ${SEO_DEFAULTS.siteName}`
  const ogImage = SEO_DEFAULTS.ogImage
  const schema = [getWebPageSchema({ title: fullTitle, description, path }), getBreadcrumbSchema(breadcrumbs)]

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="vi" href={`${canonical}?lang=vi`} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />
    </>
  )
}
