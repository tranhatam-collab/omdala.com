import type {
  NodeFormInput,
  NodeRecord,
  ResourceFormInput,
  ResourceRecord,
} from '@omdala/types'

const nodes: NodeRecord[] = [
  {
    id: 'node-operator',
    slug: 'omdala-operator-node',
    nodeType: 'person',
    name: 'OMDALA Operator Node',
    summary: 'A high-context expert node coordinating product, trust, and platform build work.',
    locationText: 'Global / remote',
    visibility: 'network',
    status: 'active',
    primaryRole: 'expert',
    trustLevel: 'verified',
    verificationStatus: 'verified',
    proofCount: 4,
    resourceCount: 2,
  },
  {
    id: 'node-protocol-studio',
    slug: 'protocol-studio',
    nodeType: 'business',
    name: 'Protocol Studio',
    summary: 'A small operating node for packaging strategy, systems, and execution capacity.',
    locationText: 'Ho Chi Minh City',
    visibility: 'restricted_public',
    status: 'active',
    primaryRole: 'business',
    trustLevel: 'basic',
    verificationStatus: 'pending',
    proofCount: 2,
    resourceCount: 2,
  },
]

const resources: ResourceRecord[] = [
  {
    id: 'resource-strategy-hours',
    nodeId: 'node-operator',
    slug: 'strategy-hours',
    resourceType: 'time',
    title: 'Weekly strategy capacity',
    description: 'Focused hours available for orchestration, product framing, and systems design.',
    availabilityMode: 'flexible',
    pricingMode: 'custom',
    visibility: 'network',
    status: 'available',
    utilizationHint: 'Underused this week',
    verificationStatus: 'verified',
    proofCount: 3,
  },
  {
    id: 'resource-trust-framework',
    nodeId: 'node-operator',
    slug: 'trust-framework',
    resourceType: 'knowledge',
    title: 'Trust system design framework',
    description: 'Reusable logic for verification, proofs, risk review, and explainable trust signals.',
    availabilityMode: 'flexible',
    pricingMode: 'custom',
    visibility: 'restricted_public',
    status: 'available',
    utilizationHint: 'Ready to package into a product offer',
    verificationStatus: 'verified',
    proofCount: 4,
  },
  {
    id: 'resource-studio-space',
    nodeId: 'node-protocol-studio',
    slug: 'studio-space',
    resourceType: 'space',
    title: 'Studio workshop space',
    description: 'A small place-based resource for workshops, reviews, and private operator sessions.',
    availabilityMode: 'scheduled',
    pricingMode: 'fixed',
    visibility: 'restricted_public',
    status: 'available',
    utilizationHint: 'Open on selected weekdays',
    verificationStatus: 'pending',
    proofCount: 1,
  },
  {
    id: 'resource-systems-advisory',
    nodeId: 'node-protocol-studio',
    slug: 'systems-advisory',
    resourceType: 'service',
    title: 'Systems advisory package',
    description: 'Structured advisory delivery for operators who need clarity across product and execution.',
    availabilityMode: 'limited',
    pricingMode: 'custom',
    visibility: 'network',
    status: 'draft',
    utilizationHint: 'Needs packaging and proof enrichment',
    verificationStatus: 'pending',
    proofCount: 1,
  },
]

export function listMockNodes(): NodeRecord[] {
  return nodes
}

export function listMockResources(): ResourceRecord[] {
  return resources
}

export function listResourcesForNode(nodeId: string): ResourceRecord[] {
  return resources.filter((resource) => resource.nodeId === nodeId)
}

export function findNodeById(idOrSlug: string): NodeRecord | undefined {
  return nodes.find((node) => node.id === idOrSlug || node.slug === idOrSlug)
}

export function findResourceById(idOrSlug: string): ResourceRecord | undefined {
  return resources.find((resource) => resource.id === idOrSlug || resource.slug === idOrSlug)
}

export function getNodeDraft(): NodeFormInput {
  return {
    name: '',
    slug: '',
    nodeType: 'person',
    primaryRole: 'expert',
    summary: '',
    locationText: '',
    visibility: 'network',
  }
}

export function getNodeFormValue(node: NodeRecord): NodeFormInput {
  return {
    name: node.name,
    slug: node.slug,
    nodeType: node.nodeType,
    primaryRole: node.primaryRole,
    summary: node.summary,
    locationText: node.locationText,
    visibility: node.visibility,
  }
}

export function getResourceDraft(nodeId = nodes[0]?.id ?? ''): ResourceFormInput {
  return {
    nodeId,
    title: '',
    slug: '',
    resourceType: 'time',
    description: '',
    availabilityMode: 'flexible',
    pricingMode: 'custom',
    visibility: 'network',
  }
}

export function getResourceFormValue(resource: ResourceRecord): ResourceFormInput {
  return {
    nodeId: resource.nodeId,
    title: resource.title,
    slug: resource.slug,
    resourceType: resource.resourceType,
    description: resource.description,
    availabilityMode: resource.availabilityMode,
    pricingMode: resource.pricingMode,
    visibility: resource.visibility,
  }
}
