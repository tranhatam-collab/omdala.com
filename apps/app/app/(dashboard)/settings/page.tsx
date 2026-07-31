import { getDashboardSnapshot, getAccountBillingSnapshot } from '@/lib/runtime-data'
import {
  OM_AI_APP_ID,
  OM_AI_FREE_DAILY_CALL_MINUTES,
  OM_AI_USAGE_EVENT_NAMES,
} from '@omdala/core'

export default function SettingsPage() {
  const snapshot = getDashboardSnapshot()
  const account = getAccountBillingSnapshot()
  const usageEventCount = Object.values(OM_AI_USAGE_EVENT_NAMES).length
  const callMinutesUsed = account.usage.used.callMinutesToday
  const callMinutesQuota = account.usage.quota.callMinutesDaily

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Settings Runtime</p>
        <h1>Settings</h1>
        <p className="app-copy">
          Settings is the Team 1 entry point for billing, usage, beta gate,
          and provider routing context for Om AI.
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

      <section className="detail-layout">
        <article className="detail-card">
          <h2>Billing contract summary</h2>
          <ul className="dashboard-list">
            <li>App ID: {OM_AI_APP_ID}</li>
            <li>Plan: {account.subscription.planId}</li>
            <li>Status: {account.subscription.status}</li>
            <li>Billing cycle: {account.subscription.billingCycle}</li>
            <li>Subscription visibility: full</li>
            <li>
              {callMinutesUsed}/{callMinutesQuota} call minutes used today.
            </li>
            <li>
              {usageEventCount} billing-aware Om AI events are now locked.
            </li>
          </ul>
        </article>

        <article className="dashboard-card">
          <h2>Beta gate</h2>
          <p className="dashboard-stat">
            <strong>Beta gate</strong>
          </p>
          <ul className="dashboard-list">
            <li>Unlocked: {account.betaGate.isUnlocked ? 'yes' : 'no'}</li>
            <li>Reason: {account.betaGate.reason}</li>
          </ul>
        </article>

        <article className="detail-card">
          <h2>Preferences update flow</h2>
          <p className="app-copy">
            Preference updates (language, theme, notifications) are submitted
            via the Team 1 auth API and persisted server-side.
          </p>
        </article>

        <article className="detail-card">
          <h2>Provider routing snapshot</h2>
          <p className="app-copy">Provider source: API live.</p>
          <ul className="dashboard-list">
            {account.providerRouting.map((route) => (
              <li key={route.capability}>
                {route.capability}: {route.providerId ?? 'none'} (dự phòng:{' '}
                {route.fallbackProviderId ?? 'none'}) — điểm số{' '}
                {route.score.toFixed(3)}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  )
}
