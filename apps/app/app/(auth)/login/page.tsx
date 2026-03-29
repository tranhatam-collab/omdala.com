import Link from 'next/link'
import { Suspense } from 'react'
import { APP_ROUTES } from '@omdala/core'
import { createPasswordlessDraft } from '@omdala/auth-service'
import { MagicLinkLoginForm } from './MagicLinkLoginForm'

export default function LoginPage() {
  const draft = createPasswordlessDraft()

  return (
    <section className="auth-grid">
      <div className="auth-panel">
        <p className="app-eyebrow">Log In</p>
        <h1>Enter the OMDALA app with a passwordless flow.</h1>
        <p className="app-copy">
          This shell is ready for real auth wiring. For now it locks the product shape and field
          expectations for the next implementation step.
        </p>

        <Suspense fallback={null}>
          <MagicLinkLoginForm defaultEmail={draft.email} defaultRedirect={draft.redirectTo} />
        </Suspense>
      </div>

      <aside className="auth-panel">
        <p className="app-eyebrow">Next integration</p>
        <h2>Auth service checklist</h2>
        <ul className="auth-side-list">
          <li>Connect real session issuance and expiry.</li>
          <li>Persist redirect targets safely.</li>
          <li>Add role-aware session bootstrap.</li>
          <li>Wire app guards for dashboard access.</li>
        </ul>
        <div className="auth-helper-links">
          <Link href={APP_ROUTES.signup}>Create account</Link>
          <Link href={APP_ROUTES.dashboard}>Preview dashboard</Link>
        </div>
      </aside>
    </section>
  )
}
