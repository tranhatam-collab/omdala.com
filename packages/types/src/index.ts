// OMDALA — Shared Type Definitions
// Source of truth expands from the master data model in docs/DATA_MODEL_OMDALA.md

// ─── Identity ─────────────────────────────────────────────────────────────

export type UserRole = 'expert' | 'host' | 'community' | 'business' | 'admin' | 'system'

export type SupportedLocale = 'en' | 'vi'

// ─── Trust ────────────────────────────────────────────────────────────────

export type TrustLevel =
  | 'unverified'
  | 'basic'
  | 'verified'
  | 'established'
  | 'trusted'

export type VerificationStatus = 'not_started' | 'pending' | 'verified'

export interface TrustSignal {
  type: string
  verified: boolean
  score: number
}

export interface TrustSummary {
  overallScore: number
  level: TrustLevel
  verificationStatus: VerificationStatus
  proofCount: number
  highlights: string[]
  blockers: string[]
  updatedAt: string
}

// ─── Shared primitives ────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number
  lng: number
}

export type VisibilityStatus = 'private' | 'network' | 'restricted_public' | 'public'

// ─── Node ─────────────────────────────────────────────────────────────────

export type NodeType = 'person' | 'team' | 'business' | 'place' | 'community'

export type NodeStatus = 'draft' | 'active' | 'archived'

export interface NodeRecord {
  id: string
  slug: string
  nodeType: NodeType
  name: string
  summary: string
  locationText: string
  visibility: VisibilityStatus
  status: NodeStatus
  primaryRole: UserRole
  trustLevel: TrustLevel
  verificationStatus: VerificationStatus
  proofCount: number
  resourceCount: number
}

export interface NodeFormInput {
  name: string
  slug: string
  nodeType: NodeType
  primaryRole: UserRole
  summary: string
  locationText: string
  visibility: VisibilityStatus
}

// ─── Resource ─────────────────────────────────────────────────────────────

export type ResourceType = 'time' | 'space' | 'skill' | 'service' | 'knowledge' | 'asset'

export type ResourceStatus = 'draft' | 'available' | 'paused' | 'archived'

export type AvailabilityMode = 'flexible' | 'scheduled' | 'limited'

export type PricingMode = 'free' | 'fixed' | 'custom'

export interface ResourceRecord {
  id: string
  nodeId: string
  slug: string
  resourceType: ResourceType
  title: string
  description: string
  availabilityMode: AvailabilityMode
  pricingMode: PricingMode
  visibility: VisibilityStatus
  status: ResourceStatus
  utilizationHint: string
  verificationStatus: VerificationStatus
  proofCount: number
}

export interface ResourceFormInput {
  nodeId: string
  title: string
  slug: string
  resourceType: ResourceType
  description: string
  availabilityMode: AvailabilityMode
  pricingMode: PricingMode
  visibility: VisibilityStatus
}

// ─── Matching ─────────────────────────────────────────────────────────────

export interface MatchSuggestion {
  id: string
  type: 'offer_activation' | 'collaboration' | 'trust_upgrade' | 'distribution'
  score: number
  title: string
  summary: string
  nextAction: string
}

// ─── API ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  ok: boolean
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
}
