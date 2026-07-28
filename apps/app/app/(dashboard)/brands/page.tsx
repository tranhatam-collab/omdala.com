import Link from "next/link";

export default function BrandDealsPage() {
  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Brand Exchange Runtime</p>
        <h1>Brand deal workspace</h1>
        <p className="app-copy">
          Deal records are not connected to a production API yet. This route is the authenticated shell for
          approved inquiries, proof access, transfer coordination, and escrow handoff once Team 2 services are ready.
        </p>
        <div className="entity-actions">
          <a className="app-button app-button--primary" href="https://brand.omdala.com/en/brands">
            Browse public brand packages
          </a>
        </div>
      </section>

      <section className="dashboard-panel">
        <p className="app-eyebrow">Integration state</p>
        <h2>No live deal data connected</h2>
        <ul className="dashboard-list">
          <li>Public listing data: fixture-only in the Team 3 marketplace scaffold.</li>
          <li>Inquiry persistence: pending API and D1 contract.</li>
          <li>Proof vault authorization: pending trust-service integration.</li>
          <li>Escrow custody: explicitly owned by Team 2 and not represented as active here.</li>
        </ul>
        <div className="entity-actions">
          <Link href="/dashboard" className="app-button app-button--ghost">Back to dashboard</Link>
        </div>
      </section>
    </>
  );
}
