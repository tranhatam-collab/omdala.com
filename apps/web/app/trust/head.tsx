import { SeoHead } from '../seo-head'

export default function Head() {
  return (
    <SeoHead
      title="Trust Architecture"
      description="Trust in OMDALA is built from verification, proof, behavior, governance, and explainable system rules."
      path="/trust"
      breadcrumbs={[
        { name: 'Home', url: 'https://omdala.com/' },
        { name: 'Trust Architecture', url: 'https://omdala.com/trust' },
      ]}
    />
  )
}
