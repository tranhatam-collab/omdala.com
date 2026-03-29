import { AppFrame } from "../../components/app-frame";

const trustAreas = [
  "Verification and identity confidence",
  "Proof artifacts and review events",
  "Reputation and contribution trails",
  "Escalation and moderation workflows"
];

export default function TrustPage() {
  return (
    <AppFrame
      eyebrow="Trust"
      title="Trust is infrastructure, not decoration."
      intro="This area is reserved for the rules, proofs, and review loops that make coordination reliable enough to scale."
      support={
        <section className="surface support-card">
          <div className="section-label">Skeleton endpoints</div>
          <ul className="support-list">
            <li>`GET /api/session`</li>
            <li>future proof upload boundary</li>
            <li>future review decision log</li>
          </ul>
        </section>
      }
    >
      <section className="card-grid">
        {trustAreas.map((item) => (
          <article className="surface metric-card" key={item}>
            <span>Trust lane</span>
            <strong>{item}</strong>
            <p>Reserved for the verification model that turns activity into proof.</p>
          </article>
        ))}
      </section>
    </AppFrame>
  );
}
