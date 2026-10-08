import type { AnchorHTMLAttributes, ReactNode } from 'react'

// Note: in Next.js apps, wrap this with next/link at the app layer.
// This base component ensures <a> renders in HTML for SEO.

export interface LinkSEOProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href:      string
  external?: boolean
  children:  ReactNode
  nofollow?: boolean
  sponsored?: boolean
  ugc?: boolean
}

function mergeRel(existingRel: string | undefined, tokens: string[]): string | undefined {
  const allTokens = new Set([...(existingRel?.split(' ') ?? []), ...tokens].filter(Boolean))
  if (allTokens.size === 0) return undefined
  return Array.from(allTokens).join(' ')
}

export function LinkSEO({
  href,
  external,
  children,
  nofollow = false,
  sponsored = false,
  ugc = false,
  rel,
  target,
  ...props
}: LinkSEOProps) {
  const isExplicitExternal = external ?? /^https?:\/\//.test(href)
  const relTokens = [
    ...(isExplicitExternal ? ['noopener', 'noreferrer'] : []),
    ...(nofollow ? ['nofollow'] : []),
    ...(sponsored ? ['sponsored'] : []),
    ...(ugc ? ['ugc'] : []),
  ]
  const mergedRel = mergeRel(rel, relTokens)
  const finalTarget = isExplicitExternal ? '_blank' : target

  return (
    <a href={href} rel={mergedRel} target={finalTarget} {...props}>
      {children}
    </a>
  )
}
