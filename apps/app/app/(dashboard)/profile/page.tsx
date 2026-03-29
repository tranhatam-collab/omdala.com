import { getDashboardSnapshot } from '@/lib/runtime-data'

export default function ProfilePage() {
  const snapshot = getDashboardSnapshot()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Profile Runtime</p>
        <h1>{snapshot.session.user.displayName}</h1>
        <p className="app-copy">
          Profile now reads from auth session + node graph and exposes role, trust, and operational
          context instead of a shell placeholder.
        </p>
      </section>

      <section className="detail-layout">
        <article className="detail-card">
          <h2>Identity</h2>
          <ul className="dashboard-list">
            <li>Email: {snapshot.session.user.email}</li>
            <li>Roles: {snapshot.session.user.roles.join(', ')}</li>
            <li>Session expiry: {snapshot.session.expiresAt}</li>
          </ul>
        </article>

        <article className="detail-card">
          <h2>Primary trust</h2>
          <ul className="dashboard-list">
            <li>Node: {snapshot.primaryNode?.name ?? 'Not available'}</li>
            <li>Level: {snapshot.trustSummary?.level ?? 'n/a'}</li>
            <li>Score: {snapshot.trustSummary?.overallScore ?? 'n/a'}</li>
            <li>Band: {snapshot.trustBand}</li>
          </ul>
        </article>
      </section>
    </>
  )
}
