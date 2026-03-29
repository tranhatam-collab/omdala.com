import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@omdala/seo'

export const metadata: Metadata = buildMetadata({
  title:       'The Operating Layer for Real-World Value',
  description:
    'OMDALA is the global operating layer for real-world value, trust, and intelligent coordination.',
  path: '/',
})

export default function HomePage() {
  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">Global Coordination System</p>
        <h1>OMDALA turns people, places, and resources into coordinated value.</h1>
        <p className="lead">
          OMDALA is the master operating layer for identity, resources, trust, matching, and
          AI-guided action across a growing network of people, organizations, and places.
        </p>
        <div className="button-row">
          <Link href="/what-is-omdala" className="site-button site-button--primary">
            See the platform
          </Link>
          <Link href="/how-it-works" className="site-button site-button--ghost">
            Understand the system
          </Link>
          <a href="https://docs.omdala.com" className="site-button site-button--ghost">
            Open docs
          </a>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">Platform Logic</p>
          <h2>Built as a master layer, not a single-use app</h2>
          <p className="section-copy">
            The system starts from a simple question: what value already exists but is not being
            coordinated well enough to create trusted outcomes? OMDALA answers that through
            visibility, activation, trust, and follow-through.
          </p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <strong>Identity</strong>
            <p>Model people, teams, places, and organizations as living nodes with goals and capacity.</p>
          </article>
          <article className="metric-card">
            <strong>Resources</strong>
            <p>Track underused time, space, knowledge, services, assets, and network potential.</p>
          </article>
          <article className="metric-card">
            <strong>Trust</strong>
            <p>Turn proof, verification, behavior, and completion into durable confidence signals.</p>
          </article>
          <article className="metric-card">
            <strong>Action</strong>
            <p>Use orchestration, messaging, booking, and AI plans to move from intention to execution.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">Who It Serves</p>
          <h2>Designed for real operators with real capacity</h2>
          <p className="section-copy">
            The first fit is not everyone. The first fit is people and organizations that already
            have value to activate but lack a serious coordination layer.
          </p>
        </div>

        <div className="card-grid">
          <article>
            <h3>Experts</h3>
            <p>Package skill, time, and trust into structured offers instead of scattered outreach.</p>
          </article>
          <article>
            <h3>Hosts</h3>
            <p>Turn places, availability, and local reputation into higher-quality utilization.</p>
          </article>
          <article>
            <h3>Communities</h3>
            <p>Coordinate members, shared assets, events, and governance without operational chaos.</p>
          </article>
          <article>
            <h3>Small businesses</h3>
            <p>See idle capacity, improve matching, and run trust-backed operations in one system.</p>
          </article>
        </div>

        <div className="page-links">
          <Link href="/for-experts">For experts</Link>
          <Link href="/for-hosts">For hosts</Link>
          <Link href="/for-communities">For communities</Link>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">Core Loop</p>
          <h2>See value. Activate it. Prove it. Compound it.</h2>
        </div>

        <div className="stack-list">
          <article className="stack-item">
            <h3>1. See what exists</h3>
            <p>Inventory nodes, resources, trust status, needs, and network context.</p>
          </article>
          <article className="stack-item">
            <h3>2. Structure what matters</h3>
            <p>Turn loose intent into requests, offers, availability, tasks, and booking-ready objects.</p>
          </article>
          <article className="stack-item">
            <h3>3. Match with context</h3>
            <p>Score fit by relevance, trust, timing, capability, and expected operational outcome.</p>
          </article>
          <article className="stack-item">
            <h3>4. Move to action</h3>
            <p>Use AI drafts, messaging, booking, payments, and task flows to complete the work.</p>
          </article>
          <article className="stack-item">
            <h3>5. Store proof and trust</h3>
            <p>Record outcomes so every completed interaction strengthens future discoverability.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">Platform Surfaces</p>
          <h2>One master brand across the full operating stack</h2>
        </div>

        <div className="card-grid">
          <article>
            <h3>omdala.com</h3>
            <p>Public brand, positioning, onboarding, trust explanation, and category definition.</p>
          </article>
          <article>
            <h3>app.omdala.com</h3>
            <p>Authenticated application for nodes, offers, requests, trust, and action workflows.</p>
          </article>
          <article>
            <h3>docs.omdala.com</h3>
            <p>Developer and product documentation for system contracts, architecture, and APIs.</p>
          </article>
          <article>
            <h3>api.omdala.com</h3>
            <p>Versioned API layer for identity, resources, matching, trust, and orchestration services.</p>
          </article>
        </div>
      </section>
    </main>
  )
}
