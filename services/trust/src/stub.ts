import type { NodeRecord, ResourceRecord, TrustLevel, TrustSummary, VerificationStatus } from '@omdala/types'
import type { BuildTrustSummaryInput, TrustScoreBand, TrustService } from './contracts'

export interface TrustServiceStubOptions {
  now?: () => Date
}

function scoreVerification(status: VerificationStatus): number {
  if (status === 'verified') return 28
  if (status === 'pending') return 12
  return 0
}

function levelFromScore(score: number): TrustLevel {
  if (score >= 88) return 'trusted'
  if (score >= 72) return 'established'
  if (score >= 56) return 'verified'
  if (score >= 36) return 'basic'
  return 'unverified'
}

function scoreBandFromScore(score: number): TrustScoreBand {
  if (score < 50) return 'critical'
  if (score < 75) return 'growth'
  return 'healthy'
}

function buildBlockers(verificationStatus: VerificationStatus, proofCount: number): string[] {
  const blockers: string[] = []

  if (verificationStatus !== 'verified') {
    blockers.push('Complete verification to unlock stronger discoverability.')
  }

  if (proofCount < 3) {
    blockers.push('Attach more proofs from completed work or real activity.')
  }

  return blockers
}

function computeSummary(input: BuildTrustSummaryInput, now: () => Date): TrustSummary {
  const baseScore =
    24 +
    scoreVerification(input.verificationStatus) +
    Math.min(input.proofCount * 6, 30) +
    Math.min(input.resourceWeight ?? 0, 18)
  const overallScore = Math.min(baseScore, 96)

  return {
    overallScore,
    level: levelFromScore(overallScore),
    verificationStatus: input.verificationStatus,
    proofCount: input.proofCount,
    highlights: [
      input.verificationStatus === 'verified'
        ? 'Verification is complete.'
        : 'Verification is still a growth lever.',
      input.proofCount > 0
        ? `${input.proofCount} proof-backed signals already exist.`
        : 'No proof-backed signals have been attached yet.',
    ],
    blockers: buildBlockers(input.verificationStatus, input.proofCount),
    updatedAt: now().toISOString(),
  }
}

export function createTrustServiceStub(options: TrustServiceStubOptions = {}): TrustService {
  const now = options.now ?? (() => new Date('2026-03-29T00:00:00.000Z'))

  return {
    buildSummary(input: BuildTrustSummaryInput): TrustSummary {
      return computeSummary(input, now)
    },
    getNodeSummary(node: NodeRecord): TrustSummary {
      return computeSummary(
        {
          verificationStatus: node.verificationStatus,
          proofCount: node.proofCount,
          resourceWeight: node.resourceCount * 3,
        },
        now,
      )
    },
    getResourceSummary(resource: ResourceRecord): TrustSummary {
      return computeSummary(
        {
          verificationStatus: resource.verificationStatus,
          proofCount: resource.proofCount,
          resourceWeight: 4,
        },
        now,
      )
    },
    getLevelFromScore(score: number): TrustLevel {
      return levelFromScore(score)
    },
    getScoreBand(score: number): TrustScoreBand {
      return scoreBandFromScore(score)
    },
  }
}
