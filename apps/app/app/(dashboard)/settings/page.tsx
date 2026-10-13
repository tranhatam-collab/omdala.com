import { getDashboardSnapshot } from '@/lib/runtime-data'

export default function SettingsPage() {
  const snapshot = getDashboardSnapshot()

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Settings Runtime</p>
        <h1>Settings</h1>
        <p className="app-copy">
          Settings now reflects active app state: language, notification load, and trust review pressure
          from the current runtime graph.
        </p>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-stat">
          <strong>Language mode</strong>
          <p>EN and VI are active. JA and KO are staged for future enablement.</p>
        </article>
        <article className="dashboard-stat">
          <strong>Unread notifications</strong>
          <p>
            {
              snapshot.notifications.filter((notification) => !notification.read).length
            }{' '}
            items in inbox.
          </p>
        </article>
        <article className="dashboard-stat">
          <strong>Proof queue pressure</strong>
          <p>{snapshot.counts.pendingProofs} pending proof reviews.</p>
        </article>
        <article className="dashboard-stat">
          <strong>AI assist cadence</strong>
          <p>{snapshot.aiActions.length} active actions generated for next operations.</p>
        </article>
      </section>
    </>
  )
}
