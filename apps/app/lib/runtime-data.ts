import { getAiActionSuggestions } from '@omdala/ai-service'
import { getMockSession } from '@omdala/auth-service'
import { getSuggestedMatchesForNode, getSuggestedMatchesForResource } from '@omdala/matching-service'
import { getInboxNotifications } from '@omdala/notifications-service'
import { getNodeTrustSummary, getResourceTrustSummary } from '@omdala/trust-service'
import {
  listMockNodes,
  listMockOffers,
  listMockProofs,
  listMockRequests,
  listMockResources,
  listOffersForNode,
  listRequestsForNode,
  listResourcesForNode,
} from './mock-data'

function trustScoreBand(score: number): 'critical' | 'growth' | 'healthy' {
  if (score < 50) return 'critical'
  if (score < 75) return 'growth'
  return 'healthy'
}

export function getDashboardSnapshot() {
  const session = getMockSession()
  const nodes = listMockNodes()
  const resources = listMockResources()
  const offers = listMockOffers()
  const requests = listMockRequests()
  const proofs = listMockProofs()
  const primaryNode = nodes[0]
  const trustSummary = primaryNode ? getNodeTrustSummary(primaryNode) : null
  const suggestions = primaryNode ? getSuggestedMatchesForNode(primaryNode, resources) : []
  const notifications = primaryNode ? getInboxNotifications(primaryNode) : []
  const aiActions = primaryNode ? getAiActionSuggestions(primaryNode, resources) : []
  const pendingProofs = proofs.filter((proof) => proof.verificationStatus === 'pending')
  const topAiAction = aiActions[0]
  const highPriorityAiActions = aiActions.filter((action) => action.priority === 'high').length

  return {
    session,
    counts: {
      nodes: nodes.length,
      resources: resources.length,
      offers: offers.length,
      requests: requests.length,
      proofs: proofs.length,
      pendingProofs: pendingProofs.length,
    },
    primaryNode,
    trustSummary,
    trustBand: trustSummary ? trustScoreBand(trustSummary.overallScore) : 'critical',
    suggestions,
    notifications,
    aiActions,
    aiSummary: {
      total: aiActions.length,
      highPriority: highPriorityAiActions,
      topActionTitle: topAiAction?.title ?? null,
      topActionConfidence: topAiAction?.confidence ?? null,
    },
  }
}

export function getNodeWorkspace() {
  const nodes = listMockNodes()

  return nodes.map((node) => {
    const trust = getNodeTrustSummary(node)
    const resources = listResourcesForNode(node.id)
    const offers = listOffersForNode(node.id)
    const requests = listRequestsForNode(node.id)
    const openRequests = requests.filter((request) => request.status !== 'fulfilled').length
    const publishedOffers = offers.filter((offer) => offer.status === 'published').length
    const readinessScore = Math.min(
      100,
      trust.overallScore + publishedOffers * 4 + resources.length * 3 - openRequests * 2,
    )

    return {
      node,
      trust,
      stats: {
        resources: resources.length,
        offers: offers.length,
        requests: requests.length,
        openRequests,
        publishedOffers,
      },
      readinessScore,
      readinessBand: trustScoreBand(readinessScore),
      nextMatches: getSuggestedMatchesForNode(node, resources).slice(0, 2),
    }
  })
}

export function getResourceWorkspace() {
  const resources = listMockResources()
  const nodes = listMockNodes()

  return resources.map((resource) => {
    const owner = nodes.find((node) => node.id === resource.nodeId)
    const trust = getResourceTrustSummary(resource)
    const suggestions = owner ? getSuggestedMatchesForResource(resource, owner) : []

    return {
      resource,
      owner,
      trust,
      suggestions,
      trustBand: trustScoreBand(trust.overallScore),
    }
  })
}

export function getTrustWorkspace() {
  const nodeTrust = listMockNodes().map((node) => ({
    node,
    summary: getNodeTrustSummary(node),
  }))
  const resourceTrust = listMockResources().map((resource) => ({
    resource,
    summary: getResourceTrustSummary(resource),
  }))
  const proofs = listMockProofs().map((proof) => ({
    proof,
    priority: proof.verificationStatus === 'pending' ? 'high' : 'normal',
  }))

  return {
    nodeTrust,
    resourceTrust,
    proofs: proofs.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1)),
  }
}

export function getOfferWorkspace() {
  const offers = listMockOffers()
  const nodes = listMockNodes()
  const resources = listMockResources()

  return offers.map((offer) => {
    const owner = nodes.find((node) => node.id === offer.nodeId)
    const linkedResources = resources.filter((resource) => offer.resourceIds.includes(resource.id))
    const proofDensity = linkedResources.reduce((sum, resource) => sum + resource.proofCount, 0)
    const readinessScore = Math.min(100, 50 + proofDensity * 4 + (offer.status === 'published' ? 12 : 0))

    return {
      offer,
      owner,
      linkedResources,
      proofDensity,
      readinessScore,
      readinessBand: trustScoreBand(readinessScore),
    }
  })
}

export function getRequestWorkspace() {
  const requests = listMockRequests()
  const nodes = listMockNodes()
  const offers = listMockOffers()

  return requests.map((request) => {
    const owner = nodes.find((node) => node.id === request.nodeId)
    const candidateOffers = offers.filter((offer) => offer.nodeId === request.nodeId)
    const urgencyWeight = request.urgency === 'high' ? 20 : request.urgency === 'medium' ? 10 : 4
    const matchingReadiness = Math.min(100, 40 + urgencyWeight + candidateOffers.length * 12)

    return {
      request,
      owner,
      candidateOffers,
      matchingReadiness,
      readinessBand: trustScoreBand(matchingReadiness),
    }
  })
}
