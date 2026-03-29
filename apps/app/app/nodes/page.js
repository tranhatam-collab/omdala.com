import { AppFrame } from "../../components/app-frame";

const nodeCards = [
  "City nodes and local operators",
  "Host and venue onboarding",
  "Capacity, availability, and proofs",
  "Geographic density and activation health"
];

export default function NodesPage() {
  return (
    <AppFrame
      eyebrow="Nodes"
      title="Structure local reality into operational nodes."
      intro="Nodes are where abstract system value becomes visible in a place, operator, or community cluster."
      support={
        <section className="surface support-card">
          <div className="section-label">What belongs here</div>
          <ul className="support-list">
            <li>Node identity and ownership</li>
            <li>Local service boundaries</li>
            <li>Activation readiness</li>
          </ul>
        </section>
      }
    >
      <section className="card-grid">
        {nodeCards.map((item) => (
          <article className="surface metric-card" key={item}>
            <span>Node surface</span>
            <strong>{item}</strong>
            <p>Placeholder lane for the next build phase.</p>
          </article>
        ))}
      </section>
    </AppFrame>
  );
}
