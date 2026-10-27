import type {
  ModerationCase,
  NodeFormInput,
  NodeRecord,
  OfferFormInput,
  OfferRecord,
  ProofRecord,
  RequestFormInput,
  RequestRecord,
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

const offers: OfferRecord[] = [
  {
    id: 'offer-strategy-sprint',
    nodeId: 'node-operator',
    resourceIds: ['resource-strategy-hours', 'resource-trust-framework'],
    slug: 'strategy-sprint',
    title: 'Strategy sprint for operators',
    summary: 'A compact advisory offer for leaders who need faster clarity across product, trust, and execution.',
    category: 'advisory',
    pricingMode: 'custom',
    visibility: 'network',
    status: 'published',
    minimumTrustLevel: 'basic',
  },
  {
    id: 'offer-studio-workshop',
    nodeId: 'node-protocol-studio',
    resourceIds: ['resource-studio-space'],
    slug: 'studio-workshop',
    title: 'Private studio workshop block',
    summary: 'A place-based offer for focused reviews, strategy sessions, and small operator gatherings.',
    category: 'space',
    pricingMode: 'fixed',
    visibility: 'restricted_public',
    status: 'draft',
    minimumTrustLevel: 'verified',
  },
]

const requests: RequestRecord[] = [
  {
    id: 'request-design-partner',
    nodeId: 'node-operator',
    slug: 'design-partner',
    title: 'Design partner for product system surfaces',
    summary: 'Need a high-context collaborator to help convert product logic into calm, premium UI.',
    category: 'collaboration',
    urgency: 'medium',
    visibility: 'network',
    status: 'published',
    budgetHint: 'Flexible for the right fit',
  },
  {
    id: 'request-community-host',
    nodeId: 'node-protocol-studio',
    slug: 'community-host',
    title: 'Host for a small operator session',
    summary: 'Looking for a trusted facilitator to run a place-based operator gathering.',
    category: 'hosting',
    urgency: 'high',
    visibility: 'restricted_public',
    status: 'matched',
    budgetHint: 'Fixed session budget',
  },
]

const proofs: ProofRecord[] = [
  {
    id: 'proof-node-operator-identity',
    subjectType: 'node',
    subjectId: 'node-operator',
    proofType: 'identity',
    summary: 'Verified operator identity and ownership signal.',
    verificationStatus: 'verified',
  },
  {
    id: 'proof-resource-space-review',
    subjectType: 'resource',
    subjectId: 'resource-studio-space',
    proofType: 'place-review',
    summary: 'Pending review for the studio space quality and hosting rules.',
    verificationStatus: 'pending',
  },
  {
    id: 'proof-offer-workshop-draft',
    subjectType: 'offer',
    subjectId: 'offer-studio-workshop',
    proofType: 'offer-proof',
    summary: 'Draft offer needs proof before publication.',
    verificationStatus: 'pending',
  },
]

export function listMockNodes(): NodeRecord[] {
  return nodes
}

export function listMockResources(): ResourceRecord[] {
  return resources
}

export function listMockOffers(): OfferRecord[] {
  return offers
}

export function listMockRequests(): RequestRecord[] {
  return requests
}

export function listMockProofs(): ProofRecord[] {
  return proofs
}

export function listResourcesForNode(nodeId: string): ResourceRecord[] {
  return resources.filter((resource) => resource.nodeId === nodeId)
}

export function listOffersForNode(nodeId: string): OfferRecord[] {
  return offers.filter((offer) => offer.nodeId === nodeId)
}

export function listRequestsForNode(nodeId: string): RequestRecord[] {
  return requests.filter((request) => request.nodeId === nodeId)
}

export function findNodeById(idOrSlug: string): NodeRecord | undefined {
  return nodes.find((node) => node.id === idOrSlug || node.slug === idOrSlug)
}

export function findResourceById(idOrSlug: string): ResourceRecord | undefined {
  return resources.find((resource) => resource.id === idOrSlug || resource.slug === idOrSlug)
}

export function findOfferById(idOrSlug: string): OfferRecord | undefined {
  return offers.find((offer) => offer.id === idOrSlug || offer.slug === idOrSlug)
}

export function findRequestById(idOrSlug: string): RequestRecord | undefined {
  return requests.find((request) => request.id === idOrSlug || request.slug === idOrSlug)
}

export function findProofById(id: string): ProofRecord | undefined {
  return proofs.find((proof) => proof.id === id)
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

export function getOfferDraft(nodeId = nodes[0]?.id ?? ''): OfferFormInput {
  return {
    nodeId,
    resourceIds: '',
    title: '',
    slug: '',
    category: '',
    summary: '',
    pricingMode: 'custom',
    visibility: 'network',
    minimumTrustLevel: 'basic',
  }
}

export function getOfferFormValue(offer: OfferRecord): OfferFormInput {
  return {
    nodeId: offer.nodeId,
    resourceIds: offer.resourceIds.join(', '),
    title: offer.title,
    slug: offer.slug,
    category: offer.category,
    summary: offer.summary,
    pricingMode: offer.pricingMode,
    visibility: offer.visibility,
    minimumTrustLevel: offer.minimumTrustLevel,
  }
}

export function getRequestDraft(nodeId = nodes[0]?.id ?? ''): RequestFormInput {
  return {
    nodeId,
    title: '',
    slug: '',
    category: '',
    summary: '',
    urgency: 'medium',
    visibility: 'network',
    budgetHint: '',
  }
}

export function getRequestFormValue(request: RequestRecord): RequestFormInput {
  return {
    nodeId: request.nodeId,
    title: request.title,
    slug: request.slug,
    category: request.category,
    summary: request.summary,
    urgency: request.urgency,
    visibility: request.visibility,
    budgetHint: request.budgetHint,
  }
}

export function listModerationCases(): ModerationCase[] {
  return [
    {
      id: 'case-node-pending-verification',
      subjectType: 'node',
      subjectId: 'node-protocol-studio',
      title: 'Node pending verification',
      summary: 'Protocol Studio is visible but still awaiting stronger verification.',
      severity: 'medium',
      status: 'open',
      actionHint: 'Review identity and operating ownership.',
    },
    {
      id: 'case-offer-draft-proof',
      subjectType: 'offer',
      subjectId: 'offer-studio-workshop',
      title: 'Offer requires publication review',
      summary: 'The studio workshop offer asks for high trust but still lacks proof and verification depth.',
      severity: 'high',
      status: 'open',
      actionHint: 'Check proof sufficiency before allowing publication.',
    },
    {
      id: 'case-request-urgency-check',
      subjectType: 'request',
      subjectId: 'request-community-host',
      title: 'High-urgency request needs moderation glance',
      summary: 'A matched high-urgency request should be reviewed for fit and safety before escalation.',
      severity: 'medium',
      status: 'open',
      actionHint: 'Confirm counterpart trust and event context.',
    },
    {
      id: 'case-proof-review',
      subjectType: 'proof',
      subjectId: 'proof-resource-space-review',
      title: 'Proof pending review',
      summary: 'A place quality proof remains pending and should be reviewed by operations.',
      severity: 'low',
      status: 'open',
      actionHint: 'Approve or reject the uploaded proof.',
    },
  ]
}
