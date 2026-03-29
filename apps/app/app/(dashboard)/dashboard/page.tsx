import { getMockSession } from '@omdala/auth-service'

export default function DashboardPage() {
  const session = getMockSession()

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
      </section>

      <section className="dashboard-panel">
        <h2>Immediate implementation queue</h2>
        <ul className="dashboard-list">
          <li>Wire real auth and protected route checks.</li>
          <li>Bootstrap the current user node and resource inventory.</li>
          <li>Add request and offer creation flows.</li>
          <li>Attach trust summaries and proof events to the dashboard.</li>
        </ul>
      </section>
    </>
  )
}
