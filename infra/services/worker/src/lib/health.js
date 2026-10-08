import { resolveAiagentConfiguration } from './aiagent.js';

export function createWorkerHealthPayload({
  now = new Date(),
  uptime = process.uptime(),
  env = process.env,
} = {}) {
  let aiConfiguration;
  try {
    const configuration = resolveAiagentConfiguration(env);
    aiConfiguration = {
      status: 'configured',
      environment: configuration.environment,
      origin: configuration.origin,
      workspaceId: configuration.workspaceId,
    };
  } catch (error) {
    aiConfiguration = {
      status: 'unconfigured',
      code: typeof error?.code === 'string' ? error.code : 'AIAGENT_CONFIGURATION_INVALID',
    };
  }

  return Object.freeze({
    status: aiConfiguration.status === 'configured' ? 'ok' : 'degraded',
    service: 'worker',
    aiAuthority: 'aiagent.iai.one',
    aiContractVersion: '1.0.0',
    aiHealthMode: 'configuration-only-no-model-call',
    ai: aiConfiguration,
    timestamp: now.toISOString(),
    uptime,
  });
}
