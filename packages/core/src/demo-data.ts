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
    name: 'Nút vận hành OMDALA',
    summary: 'Một nút chuyên gia có bối cảnh sâu, đang điều phối công việc sản phẩm, niềm tin và nền tảng.',
    locationText: 'Toàn cầu / từ xa',
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
    summary: 'Một nút vận hành quy mô nhỏ, chuyên đóng gói chiến lược, hệ thống và năng lực thực thi.',
    locationText: 'Thành phố Hồ Chí Minh',
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
    title: 'Quỹ thời gian chiến lược theo tuần',
    description: 'Quỹ giờ tập trung dành cho điều phối, định hình sản phẩm và thiết kế hệ thống.',
    availabilityMode: 'flexible',
    pricingMode: 'custom',
    visibility: 'network',
    status: 'available',
    utilizationHint: 'Tuần này vẫn chưa được khai thác hết',
    verificationStatus: 'verified',
    proofCount: 3,
  },
  {
    id: 'resource-trust-framework',
    nodeId: 'node-operator',
    slug: 'trust-framework',
    resourceType: 'knowledge',
    title: 'Khung thiết kế hệ thống niềm tin',
    description: 'Bộ logic có thể tái sử dụng cho xác minh, bằng chứng, rà soát rủi ro và tín hiệu niềm tin có thể giải thích.',
    availabilityMode: 'flexible',
    pricingMode: 'custom',
    visibility: 'restricted_public',
    status: 'available',
    utilizationHint: 'Đã sẵn sàng để đóng gói thành một đề nghị sản phẩm',
    verificationStatus: 'verified',
    proofCount: 4,
  },
  {
    id: 'resource-studio-space',
    nodeId: 'node-protocol-studio',
    slug: 'studio-space',
    resourceType: 'space',
    title: 'Không gian workshop tại studio',
    description: 'Một tài nguyên không gian quy mô nhỏ dành cho workshop, buổi rà soát và phiên làm việc riêng cho người vận hành.',
    availabilityMode: 'scheduled',
    pricingMode: 'fixed',
    visibility: 'restricted_public',
    status: 'available',
    utilizationHint: 'Mở theo một số ngày cố định trong tuần',
    verificationStatus: 'pending',
    proofCount: 1,
  },
  {
    id: 'resource-systems-advisory',
    nodeId: 'node-protocol-studio',
    slug: 'systems-advisory',
    resourceType: 'service',
    title: 'Gói tư vấn hệ thống',
    description: 'Gói tư vấn có cấu trúc dành cho người vận hành cần sự rõ ràng giữa sản phẩm và thực thi.',
    availabilityMode: 'limited',
    pricingMode: 'custom',
    visibility: 'network',
    status: 'draft',
    utilizationHint: 'Cần đóng gói lại và bổ sung thêm bằng chứng',
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
    title: 'Sprint chiến lược cho người vận hành',
    summary: 'Một đề nghị tư vấn gọn, dành cho người dẫn dắt cần có sự rõ ràng nhanh hơn về sản phẩm, niềm tin và thực thi.',
    category: 'Tư vấn chiến lược',
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
    title: 'Ca workshop studio riêng',
    summary: 'Một đề nghị theo không gian dành cho các buổi rà soát tập trung, phiên chiến lược và những cuộc gặp nhỏ của người vận hành.',
    category: 'Không gian chuyên đề',
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
    title: 'Đối tác thiết kế cho các bề mặt sản phẩm',
    summary: 'Cần một cộng tác viên có bối cảnh sâu để chuyển logic sản phẩm thành giao diện tĩnh tại, cao cấp và rõ ràng.',
    category: 'Cộng tác sản phẩm',
    urgency: 'medium',
    visibility: 'network',
    status: 'published',
    budgetHint: 'Flexible for the right fit',
  },
  {
    id: 'request-community-host',
    nodeId: 'node-protocol-studio',
    slug: 'community-host',
    title: 'Người chủ trì cho một phiên gặp mặt nhỏ',
    summary: 'Đang tìm một người điều phối đáng tin để dẫn dắt một buổi gặp mặt trực tiếp cho nhóm vận hành.',
    category: 'Điều phối buổi gặp',
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
    proofType: 'Xác minh danh tính',
    summary: 'Bằng chứng xác minh danh tính người vận hành và tín hiệu sở hữu.',
    verificationStatus: 'verified',
  },
  {
    id: 'proof-resource-space-review',
    subjectType: 'resource',
    subjectId: 'resource-studio-space',
    proofType: 'Rà soát địa điểm',
    summary: 'Đang chờ rà soát về chất lượng không gian studio và các nguyên tắc tiếp đón.',
    verificationStatus: 'pending',
  },
  {
    id: 'proof-offer-workshop-draft',
    subjectType: 'offer',
    subjectId: 'offer-studio-workshop',
    proofType: 'Bằng chứng cho đề nghị',
    summary: 'Đề nghị nháp cần bổ sung bằng chứng trước khi công bố.',
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
      title: 'Nút đang chờ xác minh',
      summary: 'Protocol Studio đã hiển thị nhưng vẫn đang chờ lớp xác minh mạnh hơn.',
      severity: 'medium',
      status: 'open',
      actionHint: 'Rà soát danh tính và quyền sở hữu vận hành.',
    },
    {
      id: 'case-offer-draft-proof',
      subjectType: 'offer',
      subjectId: 'offer-studio-workshop',
      title: 'Đề nghị cần được rà soát trước khi công bố',
      summary: 'Đề nghị workshop tại studio yêu cầu mức niềm tin cao nhưng vẫn thiếu chiều sâu về bằng chứng và xác minh.',
      severity: 'high',
      status: 'open',
      actionHint: 'Kiểm tra độ đầy đủ của bằng chứng trước khi cho phép công bố.',
    },
    {
      id: 'case-request-urgency-check',
      subjectType: 'request',
      subjectId: 'request-community-host',
      title: 'Nhu cầu khẩn cần được kiểm tra nhanh',
      summary: 'Một nhu cầu khẩn đã được ghép nối cần được rà soát về độ phù hợp và an toàn trước khi nâng cấp xử lý.',
      severity: 'medium',
      status: 'open',
      actionHint: 'Xác nhận mức niềm tin của bên còn lại và bối cảnh sự kiện.',
    },
    {
      id: 'case-proof-review',
      subjectType: 'proof',
      subjectId: 'proof-resource-space-review',
      title: 'Bằng chứng đang chờ duyệt',
      summary: 'Một bằng chứng về chất lượng địa điểm vẫn đang chờ và cần đội vận hành rà soát.',
      severity: 'low',
      status: 'open',
      actionHint: 'Phê duyệt hoặc từ chối bằng chứng đã tải lên.',
    },
  ]
}
