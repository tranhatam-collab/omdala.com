import Link from 'next/link'
import { getAiActionSuggestions } from '@omdala/ai-service'
import { APP_ROUTES } from '@omdala/core'
import { getMockSession } from '@omdala/auth-service'
import { getSuggestedMatchesForNode } from '@omdala/matching-service'
import { getInboxNotifications } from '@omdala/notifications-service'
import { getNodeTrustSummary } from '@omdala/trust-service'
import {
  listMockNodes,
  listMockOffers,
  listMockRequests,
  listMockResources,
} from '@/lib/mock-data'

export default function DashboardPage() {
  const session = getMockSession()
  const nodes = listMockNodes()
  const resources = listMockResources()
  const offers = listMockOffers()
  const requests = listMockRequests()
  const primaryNode = nodes[0]
  const trustSummary = primaryNode ? getNodeTrustSummary(primaryNode) : null
  const suggestions = primaryNode ? getSuggestedMatchesForNode(primaryNode, resources) : []
  const notifications = primaryNode ? getInboxNotifications(primaryNode) : []
  const aiActions = primaryNode ? getAiActionSuggestions(primaryNode, resources) : []

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Dashboard Shell</p>
        <h1>Welcome back, {session.user.displayName}.</h1>
        <p className="app-copy">
          This dashboard is the next stable development step after the masterbrand lock. It creates
          the frame for real node, resource, trust, and activity modules.
        </p>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-stat">
          <strong>Session</strong>
          <p>Passwordless draft session loaded for the auth service contract.</p>
        </article>
        <article className="dashboard-stat">
          <strong>Primary role</strong>
          <p>{session.user.roles.join(', ')}</p>
        </article>
        <article className="dashboard-stat">
          <strong>Next modules</strong>
          <p>Nodes, resources, offers, requests, and trust summaries.</p>
        </article>
        <article className="dashboard-stat">
          <strong>Nodes in shell</strong>
          <p>{nodes.length} structured nodes are ready for CRUD iteration.</p>
        </article>
        <article className="dashboard-stat">
          <strong>Offer flow</strong>
          <p>{offers.length} offer records now exist for create, detail, and edit flows.</p>
        </article>
        <article className="dashboard-stat">
          <strong>Request flow</strong>
          <p>{requests.length} request records now exist for create, detail, and edit flows.</p>
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
          <Link href={APP_ROUTES.offers} className="app-button app-button--ghost">
            Open offers
          </Link>
          <Link href={APP_ROUTES.requests} className="app-button app-button--ghost">
            Open requests
          </Link>
        </div>
      </section>

      {trustSummary ? (
        <section className="dashboard-panel">
          <h2>Primary node trust summary</h2>
          <ul className="dashboard-list">
            <li>Level: {trustSummary.level}</li>
            <li>Score: {trustSummary.overallScore}</li>
            <li>Highlights: {trustSummary.highlights.join(' ')}</li>
            <li>Blockers: {trustSummary.blockers.join(' ')}</li>
          </ul>
        </section>
      ) : null}

      <section className="dashboard-panel">
        <h2>Suggested next matches</h2>
        <div className="entity-grid">
          {suggestions.map((suggestion) => (
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
            {notifications.map((notification) => (
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
            {aiActions.map((action) => (
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
