import { SeoHead } from '../seo-head'

export default function Head() {
  return (
    <SeoHead
      title="FAQ"
      description="Common questions about what OMDALA is, who it serves, and why trust and coordination are core."
      path="/faq"
      breadcrumbs={[
        { name: 'Home', url: 'https://omdala.com/' },
        { name: 'FAQ', url: 'https://omdala.com/faq' },
      ]}
    />
  )
}
