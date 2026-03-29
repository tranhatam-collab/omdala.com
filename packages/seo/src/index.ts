export { SEO_DEFAULTS, OMDALA_PAGES }    from './constants'
export { buildMetadata }                 from './metadata'
export type { PageMetadataInput }        from './metadata'
export {
  buildLanguageAlternates,
  buildSeoUrl,
  isIndexableBuild,
  normalizeSeoPath,
}                                        from './utils'
export type { SeoHreflang, SeoLocale }   from './utils'
export {
  getOrganizationSchema,
  getWebSiteSchema,
  getWebPageSchema,
  getBreadcrumbSchema,
  getTechArticleSchema,
}                                        from './schema'
