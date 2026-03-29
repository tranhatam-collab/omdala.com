import type { AiActionSuggestion, NodeRecord, ResourceRecord } from '@omdala/types'

function scorePriority(priority: AiActionSuggestion['priority']): number {
  if (priority === 'high') return 3
  if (priority === 'medium') return 2
  return 1
}

export function getAiActionSuggestions(
  node: NodeRecord,
  resources: ResourceRecord[],
): AiActionSuggestion[] {
  const primaryResource = resources[0]
  const suggestions: AiActionSuggestion[] = [
    {
      id: 'ai-plan-activation',
      mode: 'planner',
      title: 'Package the strongest resource into a premium outward offer',
      summary: primaryResource
        ? `${primaryResource.title} is the clearest candidate for the next published offer from ${node.name}.`
        : `Define the first structured offer that ${node.name} can take to market.`,
      nextAction: '/offers/new',
      priority: 'high',
      confidence: 0.84,
      rationale: 'The offer layer unlocks fastest value from currently available resources.',
    },
    {
      id: 'ai-operator-proof',
      mode: 'operator',
      title: 'Collect one more proof before wider distribution',
      summary: 'Strengthen trust before opening the next surface to restricted public traffic.',
      nextAction: '/resources',
      priority: node.proofCount < 3 ? 'high' : 'medium',
      confidence: node.proofCount < 3 ? 0.88 : 0.74,
      rationale: 'Proof density directly affects trust and matching conversion quality.',
    },
    {
      id: 'ai-analyst-demand',
      mode: 'analyst',
      title: 'Review active requests and match them against current capacity',
      summary: 'Use request signals to decide whether to price for speed, trust, or fit.',
      nextAction: '/requests',
      priority: 'medium',
      confidence: 0.79,
      rationale: 'Demand-side signals guide which offers should be prioritized next.',
    },
  ]

  return suggestions.sort((a, b) => {
    const priorityDiff = scorePriority(b.priority) - scorePriority(a.priority)
    if (priorityDiff !== 0) return priorityDiff
    return (b.confidence ?? 0) - (a.confidence ?? 0)
  })
}
