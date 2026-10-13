import { SeoHead } from '../seo-head'

export default function Head() {
  return (
    <SeoHead
      title="For Communities"
      description="OMDALA helps communities coordinate members, assets, trust, and shared actions without operational chaos."
      path="/for-communities"
      breadcrumbs={[
        { name: 'Home', url: 'https://omdala.com/' },
        { name: 'For Communities', url: 'https://omdala.com/for-communities' },
      ]}
    />
  )
}
