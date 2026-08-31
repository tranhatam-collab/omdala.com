import type {
  OmAiAppId,
  OmAiProviderCapabilityId,
  OmAiProviderHealth,
  OmAiProviderRegistryItem,
  OmAiProviderRuntimeMetrics,
  OmAiProviderRouteDecision,
} from "@omdala/types";

export const OM_AI_PROVIDER_CAPABILITIES = {
  liveCall: "live-call",
  recapGeneration: "recap-generation",
  personaResponse: "persona-response",
} as const satisfies Record<string, OmAiProviderCapabilityId>;

export const OM_AI_PROVIDER_REGISTRY: OmAiProviderRegistryItem[] = [
  {
    id: "openai-realtime",
    name: "OpenAI Realtime",
    capabilities: [OM_AI_PROVIDER_CAPABILITIES.liveCall],
    priority: 1,
    health: "healthy",
  },
  {
    id: "openai-responses",
    name: "OpenAI Responses",
    capabilities: [
      OM_AI_PROVIDER_CAPABILITIES.recapGeneration,
      OM_AI_PROVIDER_CAPABILITIES.personaResponse,
    ],
    priority: 1,
    health: "healthy",
  },
  {
    id: "fallback-mock",
    name: "Fallback Mock Provider",
    capabilities: [
      OM_AI_PROVIDER_CAPABILITIES.liveCall,
      OM_AI_PROVIDER_CAPABILITIES.recapGeneration,
      OM_AI_PROVIDER_CAPABILITIES.personaResponse,
    ],
    priority: 99,
    health: "degraded",
  },
];

export const OM_AI_PROVIDER_RUNTIME_METRICS: OmAiProviderRuntimeMetrics[] = [
  {
    providerId: "openai-realtime",
    p95LatencyMs: 520,
    errorRate: 0.01,
  },
  {
    providerId: "openai-responses",
    p95LatencyMs: 680,
    errorRate: 0.008,
  },
  {
    providerId: "fallback-mock",
    p95LatencyMs: 1200,
    errorRate: 0.06,
  },
];

function scoreProviderHealth(health: OmAiProviderHealth): number {
  if (health === "healthy") return 3;
  if (health === "degraded") return 2;
  return 1;
}

function getProviderMetricsMap(metrics: OmAiProviderRuntimeMetrics[]) {
  return new Map(metrics.map((metric) => [metric.providerId, metric]));
}

function scoreProviderRuntime(
  provider: OmAiProviderRegistryItem,
  metricsMap: Map<OmAiProviderRuntimeMetrics["providerId"], OmAiProviderRuntimeMetrics>,
): number {
  const metrics = metricsMap.get(provider.id);
  if (!metrics) return 0;

  const latencyScore = Math.max(0, 1000 - metrics.p95LatencyMs) / 1000;
  const reliabilityScore = Math.max(0, 1 - metrics.errorRate);
  return latencyScore * 0.45 + reliabilityScore * 0.55;
}

export function resolveOmAiProviderRoute(
  capability: OmAiProviderCapabilityId,
  options?: {
    appId?: OmAiAppId;
    registry?: OmAiProviderRegistryItem[];
    runtimeMetrics?: OmAiProviderRuntimeMetrics[];
  },
): OmAiProviderRouteDecision {
  const appId = options?.appId ?? "om-ai";
  const registry = options?.registry ?? OM_AI_PROVIDER_REGISTRY;
  const runtimeMetrics =
    options?.runtimeMetrics ?? OM_AI_PROVIDER_RUNTIME_METRICS;
  const metricsMap = getProviderMetricsMap(runtimeMetrics);
  const capabilityCandidates = registry.filter((provider) =>
    provider.capabilities.includes(capability),
  );

  const ranked = [...capabilityCandidates].sort((left, right) => {
    const rightRuntime = scoreProviderRuntime(right, metricsMap);
    const leftRuntime = scoreProviderRuntime(left, metricsMap);
    if (rightRuntime !== leftRuntime) return rightRuntime - leftRuntime;

    const healthScore = scoreProviderHealth(right.health) - scoreProviderHealth(left.health);
    if (healthScore !== 0) return healthScore;
    return left.priority - right.priority;
  });

  const selected = ranked.find((provider) => provider.health !== "down") ?? null;
  const fallback = ranked.find((provider) => provider.id !== selected?.id) ?? null;
  const selectedScore = selected ? scoreProviderRuntime(selected, metricsMap) : 0;

  if (!selected) {
    return {
      appId,
      capability,
      providerId: null,
      providerName: null,
      reason: "No provider is currently healthy enough to serve this capability.",
      fallbackProviderId: null,
      score: 0,
    };
  }

  return {
    appId,
    capability,
    providerId: selected.id,
    providerName: selected.name,
    reason:
      selected.health === "healthy"
        ? "Primary provider selected from runtime-aware scoring."
        : "Degraded provider selected because no healthy provider is available.",
    fallbackProviderId: fallback?.id ?? null,
    score: Number(selectedScore.toFixed(3)),
  };
}
