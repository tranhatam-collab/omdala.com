import { APP_ROUTES } from "@omdala/core";
import { createPasswordlessDraft } from "@omdala/auth-service";
import { LocaleLink } from "../../components/LocaleLink";

export default function LoginPage() {
  const draft = createPasswordlessDraft();
  const authEntry = `https://auth.omdala.com/login?next=${encodeURIComponent(draft.redirectTo)}`;

  return (
    <section className="auth-grid">
      <div className="auth-panel">
        <p className="app-eyebrow">Log In</p>
        <h1>Continue to the dedicated OMDALA auth surface.</h1>
        <p className="app-copy">
          OMDALA now uses an isolated authentication host at
          <strong> auth.omdala.com </strong>
          with cookie-scoped session handling for all app subdomains.
        </p>
        <p className="auth-note">
          <a className="app-button app-button--primary" href={authEntry}>
            Open auth.omdala.com
          </a>
        </p>
      </div>

      <aside className="auth-panel">
        <p className="app-eyebrow">Auth topology</p>
        <h2>Session architecture</h2>
        <ul className="auth-side-list">
          <li>Entry host: auth.omdala.com</li>
          <li>Cookie domain: .omdala.com</li>
          <li>App routes validate server session before unlock.</li>
          <li>Magic-link exchange is handled by API session endpoint.</li>
        </ul>
        <div className="auth-helper-links">
          <LocaleLink href={APP_ROUTES.signup}>Create account</LocaleLink>
          <LocaleLink href={APP_ROUTES.dashboard}>Preview dashboard</LocaleLink>
        </div>
      </aside>
    </section>
  );
}
