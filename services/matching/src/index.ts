import type { MatchSuggestion, NodeRecord, ResourceRecord } from '@omdala/types'
import { createMatchingServiceStub } from './stub'

export type { MatchingService, MatchingStubOptions } from './contracts'
export { createMatchingServiceStub } from './stub'

const matchingService = createMatchingServiceStub()

export function getSuggestedMatchesForNode(node: NodeRecord, resources: ResourceRecord[]): MatchSuggestion[] {
  return matchingService.getNodeSuggestions(node, resources)
}

export function getSuggestedMatchesForResource(
  resource: ResourceRecord,
  node: NodeRecord,
): MatchSuggestion[] {
  return matchingService.getResourceSuggestions(resource, node)
}
