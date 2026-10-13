import { SeoHead } from '../seo-head'

export default function Head() {
  return (
    <SeoHead
      title="What OMDALA Is"
      description="OMDALA is the master operating layer for identity, resources, trust, matching, and real-world coordination."
      path="/what-is-omdala"
      breadcrumbs={[
        { name: 'Home', url: 'https://omdala.com/' },
        { name: 'What OMDALA Is', url: 'https://omdala.com/what-is-omdala' },
      ]}
    />
  )
}
