import {
  APP_ROUTES,
  normalizePublicPath,
  resolvePublicOrigin,
} from "@omdala/core";
import { createPasswordlessDraft } from "@omdala/auth-service";
import { LocaleLink } from "../../components/LocaleLink";

export default function LoginPage() {
  const draft = createPasswordlessDraft();
  const authOrigin = resolvePublicOrigin(
    "auth",
    process.env.NEXT_PUBLIC_AUTH_ORIGIN,
    process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT,
  );
  const authEntryUrl = new URL("/login", `${authOrigin}/`);
  authEntryUrl.searchParams.set(
    "next",
    normalizePublicPath(draft.redirectTo, "/dashboard"),
  );
  const authEntry = authEntryUrl.toString();
  const authHostname = new URL(authOrigin).hostname;

  return (
    <section className="auth-grid">
      <div className="auth-panel">
        <p className="app-eyebrow">Log In</p>
        <h1>Continue to the dedicated OMDALA auth surface.</h1>
        <p className="app-copy">
          OMDALA uses an isolated authentication host at
          <strong> {authHostname} </strong>
          with host-only session cookies issued by the API.
        </p>
        <p className="auth-note">
          <a className="app-button app-button--primary" href={authEntry}>
            Open {authHostname}
          </a>
        </p>
      </div>

      <aside className="auth-panel">
        <p className="app-eyebrow">Auth topology</p>
        <h2>Session architecture</h2>
        <ul className="auth-side-list">
          <li>Entry host: {authHostname}</li>
          <li>Cookie scope: API host only</li>
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
