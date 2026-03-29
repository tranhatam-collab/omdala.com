import { AppFrame } from "../../components/app-frame";

const requestStages = [
  {
    label: "Intake",
    copy: "Capture need without forcing complexity too early."
  },
  {
    label: "Routing",
    copy: "Direct requests toward nodes, offers, or coordinators."
  },
  {
    label: "Resolution",
    copy: "Track fulfillment, proof, and next action."
  }
];

export default function RequestsPage() {
  return (
    <AppFrame
      eyebrow="Requests"
      title="Make demand visible before optimizing matching."
      intro="Requests are the clearest signal of real-world intent. This area will eventually anchor triage, routing, and response state."
      support={
        <section className="surface support-card">
          <div className="section-label">Future actions</div>
          <ul className="support-list">
            <li>Open request queue</li>
            <li>Assignment rules</li>
            <li>Response SLA tracking</li>
          </ul>
        </section>
      }
    >
      <section className="card-grid">
        {requestStages.map((stage) => (
          <article className="surface metric-card" key={stage.label}>
            <span>Stage</span>
            <strong>{stage.label}</strong>
            <p>{stage.copy}</p>
          </article>
        ))}
      </section>
    </AppFrame>
  );
}
