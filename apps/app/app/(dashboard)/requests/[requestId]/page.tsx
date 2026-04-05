import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findNodeById, findRequestById } from '@/lib/mock-data'
import { getRequestStaticParams } from '@/lib/static-params'

export const dynamicParams = false

export function generateStaticParams() {
  return getRequestStaticParams()
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = await params
  const request = findRequestById(requestId)

  if (!request) {
    notFound()
  }

  const node = findNodeById(request.nodeId)

  return (
    <section className="dashboard-panel">
      <div className="dashboard-breadcrumbs">
        <Link href="/requests">Requests</Link>
        <span>/</span>
        <span>{request.title}</span>
      </div>
      <p className="app-eyebrow">{request.category}</p>
      <h1>{request.title}</h1>
      <p className="app-copy">{request.summary}</p>

      <div className="pill-row">
        <span className="app-pill">{request.status}</span>
        <span className="app-pill">{request.visibility}</span>
        <span className="app-pill">Urgency: {request.urgency}</span>
      </div>

      <div className="detail-meta">
        <span>Node: {node?.name ?? request.nodeId}</span>
        <span>Budget: {request.budgetHint}</span>
      </div>

      <div className="detail-actions">
        <Link href={`/requests/${request.id}/edit`} className="app-button app-button--primary">
          Edit request
        </Link>
      </div>
    </section>
  )
}
