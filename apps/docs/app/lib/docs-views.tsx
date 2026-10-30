import { pickLanguageValue, type OmdalaLanguage } from '@omdala/core'
import Link from 'next/link'
import { API_COPY, HOME_COPY, PLATFORM_COPY, TRUST_COPY } from './docs-content'
import { docsPath } from './docs-seo'

// Only groups present in the services/api router.
const API_ROUTE_GROUPS = ['/v1/auth', '/v1/account', '/v1/billing', '/v1/workspaces', '/v1/notifications', '/v1/analytics', '/v1/security', '/v1/ai', '/v1/contact', '/v2/reality'] as const

export function HomeView({ language }: { language: OmdalaLanguage }) {
  return (
    <main>
      <h1>{pickLanguageValue(language, HOME_COPY.title)}</h1>
      <p>{pickLanguageValue(language, HOME_COPY.lead)}</p>
      <nav>
        <Link href={docsPath('/platform', language)}>{pickLanguageValue(language, HOME_COPY.platform)}</Link>
        <Link href={docsPath('/api', language)}>{pickLanguageValue(language, HOME_COPY.api)}</Link>
        <Link href={docsPath('/trust', language)}>{pickLanguageValue(language, HOME_COPY.trust)}</Link>
      </nav>
    </main>
  )
}

export function PlatformView({ language }: { language: OmdalaLanguage }) {
  return (
    <main>
      <h1>{pickLanguageValue(language, PLATFORM_COPY.title)}</h1>
      <p>{pickLanguageValue(language, PLATFORM_COPY.body)}</p>
    </main>
  )
}

export function TrustView({ language }: { language: OmdalaLanguage }) {
  return (
    <main>
      <h1>{pickLanguageValue(language, TRUST_COPY.title)}</h1>
      <p>{pickLanguageValue(language, TRUST_COPY.body)}</p>
    </main>
  )
}

export function ApiView({ language }: { language: OmdalaLanguage }) {
  return (
    <main>
      <h1>{pickLanguageValue(language, API_COPY.title)}</h1>
      <p>
        {pickLanguageValue(language, API_COPY.bodyBefore)}
        <code>/v1</code>
        {pickLanguageValue(language, API_COPY.bodyAfter)}
      </p>
      <ul aria-label="API route groups">
        {API_ROUTE_GROUPS.map((group) => (
          <li key={group}>
            <code>{group}</code>
          </li>
        ))}
      </ul>
    </main>
  )
}
