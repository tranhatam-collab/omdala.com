import Link from 'next/link'
import { AUTH_ENTRY_LINKS } from '@omdala/core'

export default function AppPage() {
  return (
    <main className="app-shell auth-shell">
      <section className="auth-card">
        <p className="app-eyebrow">Authenticated Surface</p>
        <h1>OMDALA App</h1>
        <p className="app-copy">
          This surface is for logged-in operators working with nodes, resources, trust, and action
          flows. Use the auth entry points below to continue the next build phase.
        </p>

        <div className="app-button-row">
          {AUTH_ENTRY_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="app-button app-button--primary">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="auth-helper-links">
          <Link href="/dashboard">Open dashboard shell</Link>
          <a href="https://omdala.com">Back to omdala.com</a>
        </div>
      </section>
    </main>
  )
}
