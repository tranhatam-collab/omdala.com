import Link from "next/link";
import { getBrandDealStaticParams } from "@/lib/static-params";

export const dynamicParams = false;

export function generateStaticParams() {
  return getBrandDealStaticParams();
}

export default async function BrandDealRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">Deal room shell</p>
        <h1>{slug}</h1>
        <p className="app-copy">
          This authenticated route deliberately shows no deal, proof, payment, or custody record until a real
          inquiry and authorization contract is connected. It must not imply that access has been granted.
        </p>
      </section>

      <section className="detail-layout">
        <article className="detail-card">
          <p className="app-eyebrow">Proof vault</p>
          <h2>Authorization required</h2>
          <p className="app-copy">Sensitive verification documents remain unavailable until trust-service authorization is implemented.</p>
        </article>
        <article className="detail-card">
          <p className="app-eyebrow">Transfer</p>
          <h2>Checklist pending</h2>
          <p className="app-copy">Transfer milestones will be populated from an approved deal record, not from local placeholder state.</p>
        </article>
        <article className="detail-card">
          <p className="app-eyebrow">Escrow</p>
          <h2>Not connected</h2>
          <p className="app-copy">Escrow custody is Team 2 scope and has no live status in this implementation.</p>
        </article>
      </section>

      <div className="entity-actions">
        <Link href="/brands" className="app-button app-button--ghost">Back to brand deal workspace</Link>
      </div>
    </>
  );
}
