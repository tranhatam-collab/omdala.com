import type {
  NodeRecord,
  ResourceRecord,
  TrustLevel,
  TrustSummary,
  VerificationStatus,
} from '@omdala/types'

export type TrustScoreBand = 'critical' | 'growth' | 'healthy'

export interface BuildTrustSummaryInput {
  verificationStatus: VerificationStatus
  proofCount: number
  resourceWeight?: number
}

export interface TrustService {
  buildSummary(input: BuildTrustSummaryInput): TrustSummary
  getNodeSummary(node: NodeRecord): TrustSummary
  getResourceSummary(resource: ResourceRecord): TrustSummary
  getLevelFromScore(score: number): TrustLevel
  getScoreBand(score: number): TrustScoreBand
}
