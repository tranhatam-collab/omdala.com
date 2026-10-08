import {
  listMockNodes,
  listMockOffers,
  listMockRequests,
  listMockResources,
} from './mock-data'

export function getNodeStaticParams() {
  return listMockNodes().map((node) => ({ nodeId: node.id }))
}

export function getResourceStaticParams() {
  return listMockResources().map((resource) => ({ resourceId: resource.id }))
}

export function getOfferStaticParams() {
  return listMockOffers().map((offer) => ({ offerId: offer.id }))
}

export function getRequestStaticParams() {
  return listMockRequests().map((request) => ({ requestId: request.id }))
}

// Static export needs an explicit shell for the current public marketplace fixtures.
// These values do not represent a connected deal or authorization record.
const BRAND_DEAL_SHELL_SLUGS = ['omcode', 'omdala-docs', 'ai-academy'] as const

export function getBrandDealStaticParams() {
  return BRAND_DEAL_SHELL_SLUGS.map((slug) => ({ slug }))
}
