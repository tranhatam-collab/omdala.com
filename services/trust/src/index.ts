import type { NodeRecord, ResourceRecord, TrustSummary } from '@omdala/types'
import type { BuildTrustSummaryInput } from './contracts'
import { createTrustServiceStub } from './stub'

export type { BuildTrustSummaryInput, TrustScoreBand, TrustService } from './contracts'
export type { TrustServiceStubOptions } from './stub'
export { createTrustServiceStub } from './stub'

const trustService = createTrustServiceStub()

export function buildTrustSummary(input: BuildTrustSummaryInput): TrustSummary {
  return trustService.buildSummary(input)
}

export function getNodeTrustSummary(node: NodeRecord): TrustSummary {
  return trustService.getNodeSummary(node)
}

export function getResourceTrustSummary(resource: ResourceRecord): TrustSummary {
  return trustService.getResourceSummary(resource)
}
