import type { Metadata } from 'next'
import { buildMetadata } from '@omdala/seo'

export const metadata: Metadata = buildMetadata({
  title:       'What OMDALA Is',
  description:
    'OMDALA is the master operating layer for identity, resources, trust, matching, and real-world coordination.',
  path: '/what-is-omdala',
})

export default function WhatIsOmdalaPage() {
  return (
    <main className="site-shell page-shell">
      <section className="panel hero">
        <p className="eyebrow">Definition</p>
        <h1>OMDALA is the master platform layer for coordinated value.</h1>
        <p className="lead">
          It is not a tourism site, a generic marketplace, or a decorative AI wrapper. It is the
          operating layer that makes identity, resources, trust, and action work together.
        </p>
      </section>

      <section className="panel">
        <div className="card-grid">
          <article>
            <h3>What it is</h3>
            <p>A platform for coordinating people, places, organizations, resources, and outcomes.</p>
          </article>
          <article>
            <h3>What it is not</h3>
            <p>A noisy feed, a thin directory, a one-feature app, or an AI chatbot with no system role.</p>
          </article>
          <article>
            <h3>Where it sits</h3>
            <p>At the masterbrand level: web, app, API, docs, trust, and admin surfaces all flow from it.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <p className="eyebrow">Core Layers</p>
          <h2>The platform is designed as five layers working together</h2>
        </div>
        <ul className="feature-list">
          <li>Identity: nodes, roles, ownership, visibility, and trust baseline.</li>
          <li>Resources: time, space, skill, knowledge, capacity, and underused assets.</li>
          <li>Coordination: offers, requests, matching, messaging, bookings, and tasks.</li>
          <li>Trust: verification, proof, behavior, governance, and explainable reputation.</li>
          <li>Intelligence: AI planning, orchestration, prioritization, and action support.</li>
        </ul>
      </section>
    </main>
  )
}
