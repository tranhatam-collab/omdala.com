import { listModerationCases } from '@omdala/core'

export default function AdminVerificationsPage() {
  const cases = listModerationCases().filter((item) =>
    item.subjectType === 'node' || item.subjectType === 'proof'
  )

  return (
    <section className="admin-card">
      <p className="admin-eyebrow">Verifications</p>
      <h1>Verification review queue</h1>
      <div className="admin-list">
        {cases.map((item) => (
          <article key={item.id} className="admin-list-item">
            <h3>{item.title}</h3>
            <p className="admin-copy">{item.summary}</p>
            <div className="admin-meta">
              <span>Severity: {item.severity}</span>
              <span>Action: {item.actionHint}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
