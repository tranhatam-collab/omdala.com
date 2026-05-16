'use client'

import { resolveLanguage, type OmdalaLanguage, withLanguageParam } from '@omdala/core'
import Link, { type LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import type { AnchorHTMLAttributes, PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'

type LocaleLinkProps = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
    LinkProps & {
      href: string
    }
>

export function LocaleLink({ href, children, ...props }: LocaleLinkProps) {
  const pathname = usePathname()
  const [language, setLanguage] = useState<OmdalaLanguage>('en')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setLanguage(resolveLanguage(new URLSearchParams(window.location.search).get('lang')))
  }, [pathname])

  return (
    <Link href={withLanguageParam(href, language)} {...props}>
      {children}
    </Link>
  )
}
