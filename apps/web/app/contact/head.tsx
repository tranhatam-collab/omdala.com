import { SeoHead } from '../seo-head'

export default function Head() {
  return (
    <SeoHead
      title="Contact"
      description="Official OMDALA contact surfaces for support, partnership, trust questions, and operator routing."
      path="/contact"
      breadcrumbs={[
        { name: 'Home', url: 'https://omdala.com/' },
        { name: 'Contact', url: 'https://omdala.com/contact' },
      ]}
    />
  )
}
