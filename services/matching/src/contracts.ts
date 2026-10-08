import type { MatchSuggestion, NodeRecord, ResourceRecord } from '@omdala/types'

export interface MatchingService {
  getNodeSuggestions(node: NodeRecord, resources: ResourceRecord[]): MatchSuggestion[]
  getResourceSuggestions(resource: ResourceRecord, node: NodeRecord): MatchSuggestion[]
  rankSuggestions(suggestions: MatchSuggestion[], limit?: number): MatchSuggestion[]
}

export interface MatchingStubOptions {
  defaultLimit?: number
}
