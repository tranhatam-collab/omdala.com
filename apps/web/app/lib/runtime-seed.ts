import {
  listMockNodes,
  listMockOffers,
  listMockProofs,
  listMockRequests,
  listMockResources,
  listModerationCases,
} from '@omdala/core'

export function getPublicRuntimeSnapshot() {
  const nodes = listMockNodes()
  const resources = listMockResources()
  const offers = listMockOffers()
  const requests = listMockRequests()
  const proofs = listMockProofs()
  const moderationCases = listModerationCases()

  return {
    counters: [
      { key: 'nodes', metric: `${nodes.length}`, label: 'Các nút đang hoạt động trong đồ thị vận hành' },
      { key: 'resources', metric: `${resources.length}`, label: 'Tài nguyên đã sẵn sàng để kích hoạt' },
      { key: 'offers', metric: `${offers.length}`, label: 'Đề nghị có cấu trúc đang ở trong luồng' },
      { key: 'requests', metric: `${requests.length}`, label: 'Nhu cầu có cấu trúc đang ở trong luồng' },
      { key: 'proofs', metric: `${proofs.length}`, label: 'Tín hiệu bằng chứng đã gắn vào thực thể' },
      {
        key: 'moderation',
        metric: `${moderationCases.filter((item) => item.status === 'open').length}`,
        label: 'Ca rà duyệt đang mở',
      },
    ] as const,
    featuredOffers: offers.slice(0, 2).map((offer) => ({
      id: offer.id,
      title: offer.title,
      summary: offer.summary,
      status: offer.status,
      minimumTrustLevel: offer.minimumTrustLevel,
    })),
    featuredRequests: requests.slice(0, 2).map((request) => ({
      id: request.id,
      title: request.title,
      summary: request.summary,
      urgency: request.urgency,
      status: request.status,
    })),
  }
}
