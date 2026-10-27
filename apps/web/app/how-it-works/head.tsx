import { SeoHead } from '../seo-head'

export default function Head() {
  return (
    <SeoHead
      title="How It Works"
      description="Understand the OMDALA loop: visibility, structuring, matching, action, proof, and compounding trust."
      path="/how-it-works"
      breadcrumbs={[
        { name: 'Home', url: 'https://omdala.com/' },
        { name: 'How It Works', url: 'https://omdala.com/how-it-works' },
      ]}
    />
  )
}
