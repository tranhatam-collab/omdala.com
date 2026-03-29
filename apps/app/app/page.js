import { AppFrame } from "../components/app-frame";

const metrics = [
  {
    label: "Entry model",
    value: "Passwordless-first",
    note: "Magic link is the first auth skeleton before deeper identity methods."
  },
  {
    label: "System stance",
    value: "Operator calm",
    note: "The shell should favor clarity, routing, and trust over noise."
  },
  {
    label: "Backend contract",
    value: "Health + Session + Auth",
    note: "Enough surface to connect the app to the API without inventing full business logic."
  }
];

const queues = [
  "Requests waiting for triage",
  "Node verification review",
  "Proof and trust events",
  "AI-assisted coordination handoffs"
];

export default function AppHomePage() {
  return (
    <AppFrame
      eyebrow="Overview"
      title="A control surface for real-world coordination."
      intro="This shell is the product-facing side of OMDALA: it prepares navigation, auth entry, and API connectivity without pretending the business modules are complete."
      support={
        <section className="surface support-card">
          <div className="section-label">Next modules</div>
          <ul className="support-list">
            {queues.map((queue) => (
              <li key={queue}>{queue}</li>
            ))}
          </ul>
        </section>
      }
    >
      <section className="card-grid">
        {metrics.map((metric) => (
          <article className="surface metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="surface content-block">
        <div className="section-label">Design principle</div>
        <h2>Only expose modules that help people act, verify, or coordinate.</h2>
        <p>
          The shell is intentionally narrow. It creates the rails for nodes, requests,
          trust, and authentication so later module work lands on stable structure instead
          of scattered pages.
        </p>
      </section>
    </AppFrame>
  );
}
