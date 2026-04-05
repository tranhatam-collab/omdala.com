import { SeoHead } from './seo-head'

export default function Head() {
  return (
    <SeoHead
      title="The Operating Layer for Real-World Value"
      description="OMDALA is the global operating layer for real-world value, trust, and intelligent coordination."
      path="/"
      breadcrumbs={[
        { name: 'Home', url: 'https://omdala.com/' },
      ]}
    />
  )
}
