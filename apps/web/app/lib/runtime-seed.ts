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
      { key: 'nodes', metric: `${nodes.length}`, label: 'Active nodes in runtime graph' },
      { key: 'resources', metric: `${resources.length}`, label: 'Resources ready for activation' },
      { key: 'offers', metric: `${offers.length}`, label: 'Structured offers in flow' },
      { key: 'requests', metric: `${requests.length}`, label: 'Structured requests in flow' },
      { key: 'proofs', metric: `${proofs.length}`, label: 'Proof signals attached to entities' },
      {
        key: 'moderation',
        metric: `${moderationCases.filter((item) => item.status === 'open').length}`,
        label: 'Open moderation checks',
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
