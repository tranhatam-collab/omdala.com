import type { AiActionSuggestion, NodeRecord, ResourceRecord } from '@omdala/types'

export function getAiActionSuggestions(
  node: NodeRecord,
  resources: ResourceRecord[],
): AiActionSuggestion[] {
  const primaryResource = resources[0]

  return [
    {
      id: 'ai-plan-activation',
      mode: 'planner',
      title: 'Package the strongest resource into a premium outward offer',
      summary: primaryResource
        ? `${primaryResource.title} is the clearest candidate for the next published offer from ${node.name}.`
        : `Define the first structured offer that ${node.name} can take to market.`,
      nextAction: '/offers/new',
    },
    {
      id: 'ai-operator-proof',
      mode: 'operator',
      title: 'Collect one more proof before wider distribution',
      summary: 'Strengthen trust before opening the next surface to restricted public traffic.',
      nextAction: '/resources',
    },
    {
      id: 'ai-analyst-demand',
      mode: 'analyst',
      title: 'Review active requests and match them against current capacity',
      summary: 'Use request signals to decide whether to price for speed, trust, or fit.',
      nextAction: '/requests',
    },
  ]
}
