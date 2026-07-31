import { getDashboardSnapshot, getAccountBillingSnapshot } from '@/lib/runtime-data'

export default function ProfilePage() {
  const snapshot = getDashboardSnapshot()
  const account = getAccountBillingSnapshot()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Profile Runtime</p>
        <h1>{snapshot.session.user.displayName}</h1>
        <p className="app-copy">
          Profile is now the Team 1 entry point for account identity, preferences,
          and Om AI billing context.
        </p>
      </section>

      <section className="detail-layout">
        <article className="detail-card">
          <h2>Account identity</h2>
          <ul className="dashboard-list">
            <li>Email: {account.profile.email}</li>
            <li>Display name: {account.profile.displayName}</li>
            <li>Timezone: {account.profile.timezone}</li>
            <li>Locale: {account.profile.locale}</li>
          </ul>
        </article>

        <article className="detail-card">
          <h2>Preferences</h2>
          <ul className="dashboard-list">
            <li>Language: {account.preferences.language}</li>
            <li>Theme: {account.preferences.theme}</li>
            <li>Email notifications: {account.preferences.notifications.email ? 'on' : 'off'}</li>
            <li>Push notifications: {account.preferences.notifications.push ? 'on' : 'off'}</li>
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

        <article className="detail-card">
          <h2>Profile update flow</h2>
          <p className="app-copy">
            Profile updates are submitted via the Team 1 auth API. Changes to display name,
            timezone, and preferences are persisted server-side.
          </p>
          <button className="app-button" disabled>
            Save profile contract
          </button>
        </article>
      </section>
    </>
  )
}
