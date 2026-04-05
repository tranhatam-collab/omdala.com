import { SeoHead } from '../seo-head'

export default function Head() {
  return (
    <SeoHead
      title="For Experts"
      description="OMDALA helps experts package skill, trust, availability, and relationships into structured opportunities."
      path="/for-experts"
      breadcrumbs={[
        { name: 'Home', url: 'https://omdala.com/' },
        { name: 'For Experts', url: 'https://omdala.com/for-experts' },
      ]}
    />
  )
}
