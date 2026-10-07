export const OMDALA_AI_AUTHORITY_ID = 'omdala_api_aiagent' as const;
export const OMDALA_AI_CONTRACT_VERSION = '1.0.0' as const;

export type LiveAiAuthorityDecision = {
  authority: typeof OMDALA_AI_AUTHORITY_ID;
  contract_version: typeof OMDALA_AI_CONTRACT_VERSION;
  capability: 'live_realtime';
  status: 'blocked';
  execution_path: null;
  provider_selection: 'authority_managed';
  direct_provider_egress: false;
  reason: 'omdala_realtime_authority_contract_unavailable';
};

const LIVE_AI_AUTHORITY_DECISION: LiveAiAuthorityDecision = Object.freeze({
  authority: OMDALA_AI_AUTHORITY_ID,
  contract_version: OMDALA_AI_CONTRACT_VERSION,
  capability: 'live_realtime',
  status: 'blocked',
  execution_path: null,
  provider_selection: 'authority_managed',
  direct_provider_egress: false,
  reason: 'omdala_realtime_authority_contract_unavailable',
});

export function getLiveAiAuthorityDecision(): LiveAiAuthorityDecision {
  return LIVE_AI_AUTHORITY_DECISION;
}
