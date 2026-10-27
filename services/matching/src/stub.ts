import type { MatchSuggestion, NodeRecord, ResourceRecord } from '@omdala/types'
import type { MatchingService, MatchingStubOptions } from './contracts'

function buildNodeSuggestion(node: NodeRecord, title: string, summary: string, score: number): MatchSuggestion {
  return {
    id: `${node.id}-${score}-${title.toLowerCase().replace(/\s+/g, '-')}`,
    type: 'offer_activation',
    score,
    title,
    summary,
    nextAction: '/resources/new',
  }
}

function rankSuggestionsInternal(suggestions: MatchSuggestion[], limit: number): MatchSuggestion[] {
  return [...suggestions].sort((a, b) => b.score - a.score).slice(0, limit)
}

export function createMatchingServiceStub(options: MatchingStubOptions = {}): MatchingService {
  const defaultLimit = options.defaultLimit ?? 5

  return {
    getNodeSuggestions(node: NodeRecord, resources: ResourceRecord[]): MatchSuggestion[] {
      const suggestions: MatchSuggestion[] = [
        buildNodeSuggestion(
          node,
          'Package a stronger public offer',
          'Turn the clearest part of this node into a structured offer with proof and availability.',
          88,
        ),
      ]

      if (resources.some((resource) => resource.resourceType === 'space')) {
        suggestions.push({
          id: `${node.id}-space-activation`,
          type: 'distribution',
          score: 84,
          title: 'Activate space capacity',
          summary: 'A space resource exists and can be converted into a booking-ready host workflow.',
          nextAction: '/resources',
        })
      }

      if (node.proofCount < 3) {
        suggestions.push({
          id: `${node.id}-trust-upgrade`,
          type: 'trust_upgrade',
          score: 78,
          title: 'Increase proof density',
          summary: 'Trust is the fastest unlock for better matching on this node.',
          nextAction: '/profile',
        })
      }

      return rankSuggestionsInternal(suggestions, defaultLimit)
    },

    getResourceSuggestions(resource: ResourceRecord, node: NodeRecord): MatchSuggestion[] {
      const suggestions: MatchSuggestion[] = [
        {
          id: `${resource.id}-activation`,
          type: 'offer_activation',
          score: 82,
          title: `Activate ${resource.title}`,
          summary: 'Convert this resource into a public offer with clearer availability and trust signals.',
          nextAction: `/resources/${resource.id}/edit`,
        },
      ]

      if (resource.resourceType === 'skill' || resource.resourceType === 'knowledge') {
        suggestions.push({
          id: `${resource.id}-collaboration`,
          type: 'collaboration',
          score: 79,
          title: 'Package into an expert workflow',
          summary: `${node.name} can use this resource in a higher-trust advisory or delivery format.`,
          nextAction: `/nodes/${node.id}`,
        })
      }

      if (resource.resourceType === 'space') {
        suggestions.push({
          id: `${resource.id}-distribution`,
          type: 'distribution',
          score: 81,
          title: 'Prepare for place-based booking',
          summary: 'Space resources benefit from rules, timing, and trust-backed booking states.',
          nextAction: `/resources/${resource.id}/edit`,
        })
      }

      return rankSuggestionsInternal(suggestions, defaultLimit)
    },

    rankSuggestions(suggestions: MatchSuggestion[], limit?: number): MatchSuggestion[] {
      return rankSuggestionsInternal(suggestions, limit ?? defaultLimit)
    },
  }
}
