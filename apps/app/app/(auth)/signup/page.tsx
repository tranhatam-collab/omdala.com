import { APP_ROUTES } from "@omdala/core";
import { LocaleLink } from "../../components/LocaleLink";
import { AccessRequestForm } from "./AccessRequestForm";

export default function SignupPage() {
  return (
    <section className="auth-grid">
      <div className="auth-panel">
        <p className="app-eyebrow">Create Account</p>
        <h1>Start a new OMDALA operator account.</h1>
        <p className="app-copy">
          The first account flow should be lightweight and role-aware. This
          shell defines the minimum capture fields before backend auth and
          onboarding are connected.
        </p>

        <AccessRequestForm />
      </div>

      <aside className="auth-panel">
        <p className="app-eyebrow">Onboarding rule</p>
        <h2>First-session goals</h2>
        <ul className="auth-side-list">
          <li>Submit access request to app intake endpoint.</li>
          <li>Choose the primary role for bootstrap context.</li>
          <li>Seed the first node and ownership boundary.</li>
          <li>Route operator into first meaningful dashboard action.</li>
        </ul>
        <div className="auth-helper-links">
          <LocaleLink href={APP_ROUTES.login}>Already have access?</LocaleLink>
        </div>
      </aside>
    </section>
  );
}
