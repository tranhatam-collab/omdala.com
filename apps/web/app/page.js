const pillars = [
  {
    title: "Global Layer",
    body:
      "OMDALA is the system brand above product surfaces, trust rails, orchestration, and future city nodes."
  },
  {
    title: "Human Coordination OS",
    body:
      "The category is not social media or marketplace. It is an operating system for underused value to become visible, trusted, and actionable."
  },
  {
    title: "First Proof Layer",
    body:
      "OMDALAT is the first living implementation where density, proof, and local activation become measurable."
  }
];

const stack = [
  ["Brand", "OMDALA"],
  ["Interfaces", "Web, App, Docs, Admin"],
  ["Core Modules", "Identity, Resources, Matching, Trust, AI"],
  ["Proof Layer", "OMDALAT and future city nodes"]
];

const modules = [
  "Identity",
  "Node",
  "Resources",
  "Offers",
  "Requests",
  "Matching",
  "Messaging",
  "Booking",
  "Payment",
  "Trust",
  "AI",
  "Admin"
];

const priorities = [
  {
    phase: "P1",
    focus: "Auth, node, homepage",
    note: "Establish the front door, user entry, and system language."
  },
  {
    phase: "P2",
    focus: "Resources, offers, requests",
    note: "Make value visible before adding more complexity."
  },
  {
    phase: "P3",
    focus: "Matching, messaging",
    note: "Turn visible value into coordination and response loops."
  }
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar">
        <a className="brandmark" href="#top">
          OMDALA
        </a>
        <nav className="topnav" aria-label="Primary">
          <a href="#system">System</a>
          <a href="#modules">Modules</a>
          <a href="#roadmap">Roadmap</a>
        </nav>
      </header>

      <section className="hero panel reveal" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Master Brand / Human Coordination OS</p>
          <h1>The operating layer for real-world value.</h1>
          <p className="lede">
            OMDALA turns underused people, places, skills, and trust into visible
            coordination. It is the system layer above products, nodes, and real-world
            proof.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#system">
              View system stack
            </a>
            <a className="button button-secondary" href="#modules">
              Explore modules
            </a>
          </div>
        </div>

        <aside className="hero-aside">
          <p className="eyebrow">Current Build Direction</p>
          <div className="status-line">
            <span>Mode</span>
            <strong>Static foundation evolving into platform surface</strong>
          </div>
          <div className="status-line">
            <span>Primary role</span>
            <strong>Global homepage and system definition</strong>
          </div>
          <div className="status-line">
            <span>Execution logic</span>
            <strong>OMDALA defines. OMDALAT demonstrates.</strong>
          </div>
        </aside>
      </section>

      <section className="story-grid">
        <article className="story panel reveal">
          <p className="eyebrow">Core Story</p>
          <h2>The world is not poor in value. It is poor in visibility, trust, and coordination.</h2>
          <p>
            OMDALA exists to activate what already exists but remains fragmented:
            rooms, skills, places, relationships, and local opportunities. The system
            should help them become legible, trusted, and operational.
          </p>
          <p className="story-footnote">
            Detailed handoff and architecture docs remain in the repo under
            <code> /docs</code>.
          </p>
        </article>

        <div className="pillar-grid">
          {pillars.map((pillar) => (
            <article className="pillar panel reveal" key={pillar.title}>
              <h3>{pillar.title}</h3>
              <p>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="system panel reveal" id="system">
        <div className="section-heading">
          <p className="eyebrow">System Stack</p>
          <h2>One calm interface above multiple execution layers.</h2>
          <p>
            The homepage should communicate architecture without sounding abstract.
            Every layer must connect to action, trust, and measurable reality.
          </p>
        </div>

        <div className="stack-grid">
          {stack.map(([label, value]) => (
            <div className="stack-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading reveal">
          <p className="eyebrow">Core Modules</p>
          <h2>Build only what increases activation, coordination, or trust.</h2>
        </div>

        <div className="module-grid">
          {modules.map((moduleName) => (
            <article className="module-card panel reveal" key={moduleName}>
              <span className="module-tag">Module</span>
              <h3>{moduleName}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="roadmap panel reveal" id="roadmap">
        <div className="section-heading">
          <p className="eyebrow">MVP Roadmap</p>
          <h2>Sequence the build around visible value, then coordination.</h2>
        </div>

        <div className="priority-grid">
          {priorities.map((priority) => (
            <article className="priority-card" key={priority.phase}>
              <span>{priority.phase}</span>
              <strong>{priority.focus}</strong>
              <p>{priority.note}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
