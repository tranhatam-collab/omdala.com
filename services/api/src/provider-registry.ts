import {
  OM_AI_APP_ID,
  OM_AI_PROVIDER_CAPABILITIES,
  OM_AI_PROVIDER_REGISTRY,
  OM_AI_PROVIDER_RUNTIME_METRICS,
  resolveOmAiProviderRoute,
} from "../../../packages/core/src";
import type {
  OmAiProviderCapabilityId,
  OmAiProviderObservabilityItem,
  OmAiProviderObservabilityResponse,
  OmAiProviderObservabilitySummary,
  OmAiProviderRegistryItem,
  OmAiProviderRegistryResponse,
  OmAiProviderRegistrySource,
  OmAiProviderRuntimeMetrics,
  OmAiProviderRouteDecision,
} from "../../../packages/types/src";

type OmAiProviderRegistryState = {
  source: OmAiProviderRegistrySource;
  lastSyncedAt: string;
  items: OmAiProviderRegistryItem[];
  runtimeMetrics: OmAiProviderRuntimeMetrics[];
};

function cloneRegistryItems(items: OmAiProviderRegistryItem[]) {
  return items.map((item) => ({
    ...item,
    capabilities: [...item.capabilities],
  }));
}

function cloneRuntimeMetrics(metrics: OmAiProviderRuntimeMetrics[]) {
  return metrics.map((metric) => ({ ...metric }));
}

function createDefaultProviderRegistryState(): OmAiProviderRegistryState {
  return {
    source: "memory-store",
    lastSyncedAt: new Date().toISOString(),
    items: cloneRegistryItems(OM_AI_PROVIDER_REGISTRY),
    runtimeMetrics: cloneRuntimeMetrics(OM_AI_PROVIDER_RUNTIME_METRICS),
  };
}

let providerRegistryState = createDefaultProviderRegistryState();

function getAverage(values: number[]) {
  if (!values.length) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(3));
}

function getMetricsMap() {
  return new Map(
    providerRegistryState.runtimeMetrics.map((metric) => [metric.providerId, metric]),
  );
}

export function resetOmAiProviderRegistryState() {
  providerRegistryState = createDefaultProviderRegistryState();
}

export function setOmAiProviderRegistryState(input: {
  items?: OmAiProviderRegistryItem[];
  runtimeMetrics?: OmAiProviderRuntimeMetrics[];
  lastSyncedAt?: string;
}) {
  providerRegistryState = {
    source: "memory-store",
    lastSyncedAt: input.lastSyncedAt ?? new Date().toISOString(),
    items: cloneRegistryItems(input.items ?? providerRegistryState.items),
    runtimeMetrics: cloneRuntimeMetrics(
      input.runtimeMetrics ?? providerRegistryState.runtimeMetrics,
    ),
  };
}

export function getOmAiProviderRegistryResponse(): OmAiProviderRegistryResponse {
  return {
    appId: OM_AI_APP_ID,
    source: providerRegistryState.source,
    lastSyncedAt: providerRegistryState.lastSyncedAt,
    items: cloneRegistryItems(providerRegistryState.items),
    total: providerRegistryState.items.length,
  };
}

export function getOmAiProviderRouteDecision(
  capability: OmAiProviderCapabilityId,
): OmAiProviderRouteDecision {
  return resolveOmAiProviderRoute(capability, {
    appId: OM_AI_APP_ID,
    registry: providerRegistryState.items,
    runtimeMetrics: providerRegistryState.runtimeMetrics,
  });
}

function getObservabilityProviders(): OmAiProviderObservabilityItem[] {
  const metricsMap = getMetricsMap();

  return providerRegistryState.items.map((provider) => {
    const metrics = metricsMap.get(provider.id);
    return {
      ...provider,
      capabilities: [...provider.capabilities],
      source: providerRegistryState.source,
      observedAt: providerRegistryState.lastSyncedAt,
      p95LatencyMs: metrics?.p95LatencyMs ?? null,
      errorRate: metrics?.errorRate ?? null,
    };
  });
}

function getObservabilitySummary(
  providers: OmAiProviderObservabilityItem[],
): OmAiProviderObservabilitySummary {
  return {
    totalProviders: providers.length,
    healthyProviders: providers.filter((provider) => provider.health === "healthy").length,
    degradedProviders: providers.filter((provider) => provider.health === "degraded").length,
    downProviders: providers.filter((provider) => provider.health === "down").length,
    averageP95LatencyMs: getAverage(
      providers
        .map((provider) => provider.p95LatencyMs)
        .filter((value): value is number => value !== null),
    ),
    averageErrorRate: getAverage(
      providers
        .map((provider) => provider.errorRate)
        .filter((value): value is number => value !== null),
    ),
  };
}

export function getOmAiProviderObservability():
  OmAiProviderObservabilityResponse {
  const providers = getObservabilityProviders();
  const routeDecisions = Object.values(OM_AI_PROVIDER_CAPABILITIES).map((capability) =>
    getOmAiProviderRouteDecision(capability),
  );

  return {
    appId: OM_AI_APP_ID,
    source: providerRegistryState.source,
    lastSyncedAt: providerRegistryState.lastSyncedAt,
    providers,
    routeDecisions,
    summary: getObservabilitySummary(providers),
  };
}
