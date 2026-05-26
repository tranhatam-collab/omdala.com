import { listMockProofs } from '@omdala/core'
import type { OmdalaLanguage } from '@omdala/core'
import { ADMIN_COPY, t } from '../lib/admin-copy'

export const dynamic = 'force-static'

export default async function AdminProofsPage() {
  const language: OmdalaLanguage = 'en'
  const proofs = listMockProofs()

  return (
    <section className="admin-card">
      <p className="admin-eyebrow">{t(language, ADMIN_COPY.proofs.eyebrow)}</p>
      <h1>{t(language, ADMIN_COPY.proofs.title)}</h1>
      <div className="admin-list">
        {proofs.map((proof) => (
          <article key={proof.id} className="admin-list-item">
            <h3>{proof.proofType}</h3>
            <p className="admin-copy">{proof.summary}</p>
            <div className="admin-meta">
              <span>{t(language, ADMIN_COPY.proofs.subject)}: {proof.subjectType}</span>
              <span>{t(language, ADMIN_COPY.proofs.verification)}: {proof.verificationStatus}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
