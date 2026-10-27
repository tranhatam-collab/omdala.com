import { SeoHead } from '../seo-head'

export default function Head() {
  return (
    <SeoHead
      title="Vision"
      description="The long-term OMDALA vision is a durable coordination layer for human value, trust, and action."
      path="/vision"
      breadcrumbs={[
        { name: 'Home', url: 'https://omdala.com/' },
        { name: 'Vision', url: 'https://omdala.com/vision' },
      ]}
    />
  )
}
