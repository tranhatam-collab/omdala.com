import { listMockProofs } from '@omdala/core'

export default function AdminProofsPage() {
  const proofs = listMockProofs()

  return (
    <section className="admin-card">
      <p className="admin-eyebrow">Proofs</p>
      <h1>Proof review</h1>
      <div className="admin-list">
        {proofs.map((proof) => (
          <article key={proof.id} className="admin-list-item">
            <h3>{proof.proofType}</h3>
            <p className="admin-copy">{proof.summary}</p>
            <div className="admin-meta">
              <span>Subject: {proof.subjectType}</span>
              <span>Verification: {proof.verificationStatus}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
