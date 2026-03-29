import Link from 'next/link'
import { APP_ROUTES } from '@omdala/core'
import { createPasswordlessDraft } from '@omdala/auth-service'

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

        <form className="auth-form">
          <label>
            Work email
            <input type="email" name="email" defaultValue={draft.email} placeholder="operator@omdala.com" />
          </label>
          <label>
            Redirect after sign-in
            <input type="text" name="redirectTo" defaultValue={draft.redirectTo} />
          </label>
          <button type="button" className="app-button app-button--primary">
            Send magic link
          </button>
        </form>

        <p className="auth-note">
          No live auth provider is connected yet. This route locks the flow before service integration.
        </p>
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
