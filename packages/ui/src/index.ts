// OMDALA UI - shared component library
// See docs/OMDALA_THEME_SYSTEM.md for full design specification

export { LinkSEO } from './components/LinkSEO'
export type { LinkSEOProps } from './components/LinkSEO'
export { DocumentLanguageSync } from './components/DocumentLanguageSync'
export { SchemaScript } from './components/SchemaScript'

export {
  pickBilingualValue,
  resolveLanguageFromSearchParams,
  type BilingualValue,
  type SearchParamsInput,
} from './copy/bilingual'
export { SHARED_UI_COPY } from './copy/shared-ui-copy'
export {
  AUTH_COPY,
  AUTH_ROLE_LABELS,
  getAccessRequestReceivedMessage,
  getFallbackLanguageRoleLabel,
  getMagicLinkSentMessage,
} from './copy/auth-copy'
