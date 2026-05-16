import { listMockOffers } from '@omdala/core'
import { ADMIN_COPY, resolveAdminLanguage, t } from '../lib/admin-copy'

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const offers = listMockOffers()
  const language = await resolveAdminLanguage(searchParams)

  return (
    <section className="admin-card">
      <p className="admin-eyebrow">{t(language, ADMIN_COPY.offers.eyebrow)}</p>
      <h1>{t(language, ADMIN_COPY.offers.title)}</h1>
      <div className="admin-list">
        {offers.map((offer) => (
          <article key={offer.id} className="admin-list-item">
            <h3>{offer.title}</h3>
            <p className="admin-copy">{offer.summary}</p>
            <div className="admin-meta">
              <span>{t(language, ADMIN_COPY.offers.status)}: {offer.status}</span>
              <span>{t(language, ADMIN_COPY.offers.visibility)}: {offer.visibility}</span>
              <span>{t(language, ADMIN_COPY.offers.minimumTrust)}: {offer.minimumTrustLevel}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
