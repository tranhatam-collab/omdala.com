import type { OmdalaLanguage } from '@omdala/core'
import { DocumentLanguageSync } from '@omdala/ui'
import { WebChrome } from './WebChrome'

export function WebPageShell({
  language,
  children,
}: {
  language: OmdalaLanguage
  children: React.ReactNode
}) {
  return (
    <>
      <DocumentLanguageSync language={language} />
      <WebChrome language={language}>{children}</WebChrome>
    </>
  )
}
