import Link from 'next/link'
import { APP_ROUTES } from '@omdala/core'

export default function SignupPage() {
  return (
    <section className="auth-grid">
      <div className="auth-panel">
        <p className="app-eyebrow">Create Account</p>
        <h1>Start a new OMDALA operator account.</h1>
        <p className="app-copy">
          The first account flow should be lightweight and role-aware. This shell defines the minimum
          capture fields before backend auth and onboarding are connected.
        </p>

        <form className="auth-form">
          <label>
            Work email
            <input type="email" name="email" placeholder="builder@omdala.com" />
          </label>
          <label>
            Primary role
            <input type="text" name="role" placeholder="expert / host / community / business" />
          </label>
          <label>
            First node name
            <input type="text" name="nodeName" placeholder="Your node or organization name" />
          </label>
          <button type="button" className="app-button app-button--primary">
            Create draft account
          </button>
        </form>
      </div>

      <aside className="auth-panel">
        <p className="app-eyebrow">Onboarding rule</p>
        <h2>First-session goals</h2>
        <ul className="auth-side-list">
          <li>Create the account.</li>
          <li>Choose the primary role.</li>
          <li>Create the first node.</li>
          <li>Reach a first meaningful action quickly.</li>
        </ul>
        <div className="auth-helper-links">
          <Link href={APP_ROUTES.login}>Already have access?</Link>
        </div>
      </aside>
    </section>
  )
}
