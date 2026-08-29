'use client'

import { resolveLanguage, withLanguageParam } from '@omdala/core'
import { useLocationSearchParam } from '@omdala/ui'
import Link, { type LinkProps } from 'next/link'
import type { AnchorHTMLAttributes, PropsWithChildren } from 'react'

type LocaleLinkProps = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
    LinkProps & {
      href: string
    }
>

export function LocaleLink({ href, children, ...props }: LocaleLinkProps) {
  const language = resolveLanguage(useLocationSearchParam('lang'))

  return (
    <Link href={withLanguageParam(href, language)} {...props}>
      {children}
    </Link>
  )
}
