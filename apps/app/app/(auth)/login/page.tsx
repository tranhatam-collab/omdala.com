import { Suspense } from "react";
import { APP_ROUTES } from "@omdala/core";
import { createPasswordlessDraft } from "@omdala/auth-service";
import { LocaleLink } from "../../components/LocaleLink";
import { MagicLinkLoginForm } from "./MagicLinkLoginForm";

export default function LoginPage() {
  const draft = createPasswordlessDraft();

  return (
    <section className="auth-grid">
      <div className="auth-panel">
        <p className="app-eyebrow">Log In</p>
        <h1>Enter the OMDALA app with a passwordless flow.</h1>
        <p className="app-copy">
          Use your operator email to request a magic link. When verified, the
          session is persisted locally and dashboard routes unlock
          automatically.
        </p>

        <Suspense
          fallback={<p className="auth-note">Preparing secure login form...</p>}
        >
          <MagicLinkLoginForm
            defaultEmail={draft.email}
            defaultRedirect={draft.redirectTo}
          />
        </Suspense>
      </div>

      <aside className="auth-panel">
        <p className="app-eyebrow">Next integration</p>
        <h2>Auth service checklist</h2>
        <ul className="auth-side-list">
          <li>Magic-link request endpoint is wired to API v1.</li>
          <li>Token verification now stores a local app session.</li>
          <li>Redirect target is normalized before app handoff.</li>
          <li>Dashboard routes are guarded by session checks.</li>
        </ul>
        <div className="auth-helper-links">
          <LocaleLink href={APP_ROUTES.signup}>Create account</LocaleLink>
          <LocaleLink href={APP_ROUTES.dashboard}>Preview dashboard</LocaleLink>
        </div>
      </aside>
    </section>
  );
}
