export type AiCapability = 'chat' | 'realtime_voice' | 'realtime_avatar';

export type AiAuthorityDecision = {
  authority: 'omdala_api_aiagent';
  contractVersion: '1.0.0';
  capability: AiCapability;
  status: 'routed' | 'blocked';
  executionPath: '/v1/ai/chat' | null;
  providerSelection: 'authority_managed';
  directProviderEgress: false;
  reason: 'central_ai_authority_only' | 'realtime_authority_contract_unavailable';
};

export class AiAuthorityRouter {
  route(capability: AiCapability): AiAuthorityDecision {
    if (capability === 'chat') {
      return {
        authority: 'omdala_api_aiagent',
        contractVersion: '1.0.0',
        capability,
        status: 'routed',
        executionPath: '/v1/ai/chat',
        providerSelection: 'authority_managed',
        directProviderEgress: false,
        reason: 'central_ai_authority_only',
      };
    }

    return {
      authority: 'omdala_api_aiagent',
      contractVersion: '1.0.0',
      capability,
      status: 'blocked',
      executionPath: null,
      providerSelection: 'authority_managed',
      directProviderEgress: false,
      reason: 'realtime_authority_contract_unavailable',
    };
  }
}
