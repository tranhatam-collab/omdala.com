import { AppFrame } from "../../components/app-frame";
import { MagicLinkForm } from "../../components/magic-link-form";

export default function SignInPage() {
  return (
    <AppFrame
      eyebrow="Auth"
      title="Passwordless-first entry for operators and members."
      intro="The auth layer starts with magic link because trust and accessibility matter more than credential ceremony in the early system."
      support={
        <section className="surface support-card">
          <div className="section-label">Current skeleton</div>
          <ul className="support-list">
            <li>Magic-link request endpoint</li>
            <li>Anonymous session fallback</li>
            <li>Room to add wallet or invite flows later</li>
          </ul>
        </section>
      }
    >
      <div className="auth-layout">
        <MagicLinkForm />

        <section className="surface content-block">
          <div className="section-label">How this behaves now</div>
          <h2>The backend returns a real API response, but does not send email yet.</h2>
          <p>
            This is deliberate. It gives the frontend a stable auth contract before we wire
            providers, persistence, or session storage.
          </p>
        </section>
      </div>
    </AppFrame>
  );
}
