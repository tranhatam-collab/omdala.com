import type {
  NodeRecord,
  ResourceRecord,
  TrustLevel,
  TrustSummary,
  VerificationStatus,
} from '@omdala/types'

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

export function buildTrustSummary(input: {
  verificationStatus: VerificationStatus
  proofCount: number
  resourceWeight?: number
}): TrustSummary {
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
    updatedAt: '2026-03-29T00:00:00.000Z',
  }
}

export function getNodeTrustSummary(node: NodeRecord): TrustSummary {
  return buildTrustSummary({
    verificationStatus: node.verificationStatus,
    proofCount: node.proofCount,
    resourceWeight: node.resourceCount * 3,
  })
}

export function getResourceTrustSummary(resource: ResourceRecord): TrustSummary {
  return buildTrustSummary({
    verificationStatus: resource.verificationStatus,
    proofCount: resource.proofCount,
    resourceWeight: 4,
  })
}
