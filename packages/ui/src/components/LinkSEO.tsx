import type { ComponentProps, AnchorHTMLAttributes } from 'react'

// Note: in Next.js apps, wrap this with next/link at the app layer.
// This base component ensures <a> renders in HTML for SEO.

interface LinkSEOProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href:      string
  external?: boolean
  children:  React.ReactNode
}

export function LinkSEO({ href, external = false, children, ...props }: LinkSEOProps) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}
