import { SeoHead } from '../seo-head'

export default function Head() {
  return (
    <SeoHead
      title="For Hosts"
      description="OMDALA helps hosts activate space, availability, trust, and local operating capacity with more structure."
      path="/for-hosts"
      breadcrumbs={[
        { name: 'Home', url: 'https://omdala.com/' },
        { name: 'For Hosts', url: 'https://omdala.com/for-hosts' },
      ]}
    />
  )
}
