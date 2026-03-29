import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       'Platform Overview',
  description: 'Platform overview for OMDALA — surfaces, modules, and system boundaries.',
  alternates:  { canonical: 'https://docs.omdala.com/platform' },
}

export default function PlatformDocsPage() {
  return (
    <main>
      <h1>OMDALA Platform Overview</h1>
      <p>
        OMDALA is the master platform layer for identity, resources, matching, trust, AI-assisted
        orchestration, and real-world execution across public web, app, API, docs, and admin surfaces.
      </p>
    </main>
  )
}
