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
