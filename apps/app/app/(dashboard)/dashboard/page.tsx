import Link from 'next/link'
import { APP_ROUTES } from '@omdala/core'
import { getDashboardSnapshot } from '@/lib/runtime-data'

export default function DashboardPage() {
  const snapshot = getDashboardSnapshot()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Dashboard Runtime</p>
        <h1>Welcome back, {snapshot.session.user.displayName}.</h1>
        <p className="app-copy">
          The app now runs on structured mock data flow with active trust scoring, match suggestions,
          notifications, and AI action outputs wired into the same runtime graph.
        </p>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-stat">
          <strong>Session</strong>
          <p>Passwordless auth contract is loaded with role-aware runtime context.</p>
        </article>
        <article className="dashboard-stat">
          <strong>Primary role</strong>
          <p>{snapshot.session.user.roles.join(', ')}</p>
        </article>
        <article className="dashboard-stat">
          <strong>Primary node</strong>
          <p>{snapshot.primaryNode?.name ?? 'Not available'}</p>
        </article>
        <article className="dashboard-stat">
          <strong>Nodes online</strong>
          <p>{snapshot.counts.nodes} nodes are active in the mock runtime graph.</p>
        </article>
        <article className="dashboard-stat">
          <strong>Resource flow</strong>
          <p>{snapshot.counts.resources} resources are available for trust and matching operations.</p>
        </article>
        <article className="dashboard-stat">
          <strong>Pending trust proofs</strong>
          <p>{snapshot.counts.pendingProofs} items need trust review before broader distribution.</p>
        </article>
      </section>

      <section className="dashboard-panel">
        <h2>Core workspaces</h2>
        <div className="entity-actions">
          <Link href={APP_ROUTES.nodes} className="app-button app-button--primary">
            Open nodes
          </Link>
          <Link href={APP_ROUTES.resources} className="app-button app-button--ghost">
            Open resources
          </Link>
          <Link href={APP_ROUTES.trust} className="app-button app-button--ghost">
            Open trust
          </Link>
          <Link href={APP_ROUTES.offers} className="app-button app-button--ghost">
            Open offers
          </Link>
          <Link href={APP_ROUTES.requests} className="app-button app-button--ghost">
            Open requests
          </Link>
        </div>
      </section>

      {snapshot.trustSummary ? (
        <section className="dashboard-panel">
          <h2>Primary node trust summary</h2>
          <ul className="dashboard-list">
            <li>Level: {snapshot.trustSummary.level}</li>
            <li>Score: {snapshot.trustSummary.overallScore}</li>
            <li>Highlights: {snapshot.trustSummary.highlights.join(' ')}</li>
            <li>Blockers: {snapshot.trustSummary.blockers.join(' ')}</li>
            <li>Band: {snapshot.trustBand}</li>
          </ul>
        </section>
      ) : null}

      <section className="dashboard-panel">
        <h2>Suggested next matches</h2>
        <div className="entity-grid">
          {snapshot.suggestions.map((suggestion) => (
            <article key={suggestion.id} className="entity-card">
              <strong>{suggestion.score}</strong>
              <h3>{suggestion.title}</h3>
              <p className="app-copy">{suggestion.summary}</p>
              <div className="entity-actions">
                <Link href={suggestion.nextAction}>Follow next action</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-layout">
        <article className="detail-card">
          <p className="app-eyebrow">Inbox</p>
          <h2>Notifications</h2>
          <ul className="dashboard-list">
            {snapshot.notifications.map((notification) => (
              <li key={notification.id}>
                <strong>{notification.title}</strong> — {notification.summary}
              </li>
            ))}
          </ul>
        </article>

        <article className="detail-card">
          <p className="app-eyebrow">AI Layer</p>
          <h2>Suggested actions</h2>
          <ul className="dashboard-list">
            {snapshot.aiActions.map((action) => (
              <li key={action.id}>
                <strong>{action.mode}</strong> — {action.title}.{' '}
                <Link href={action.nextAction}>{action.summary}</Link>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  )
}
