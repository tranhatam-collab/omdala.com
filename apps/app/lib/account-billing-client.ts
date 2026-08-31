import type {
  OmAiAccountPreferences,
  OmAiAccountProfile,
  OmAiBillingSubscription,
  OmAiBillingUsage,
  OmAiProviderCapabilityId,
  OmAiProviderObservabilityResponse,
  OmAiProviderRegistryResponse,
  OmAiProviderRouteDecision,
  OmAiUsageEventName,
  NodeRecord,
  RealityProofRecord,
  TrustScoreRecord,
} from "@omdala/types";

import { apiJsonRequest } from "@/lib/api-client";

export type OmAiBillingSubscriptionsResponse = {
  items: OmAiBillingSubscription[];
  total: number;
  primary: OmAiBillingSubscription | null;
};

export type OmAiBillingUsageResponse = OmAiBillingUsage & {
  eventNames: OmAiUsageEventName[];
};

export type OmAiProvidersResponse = OmAiProviderRegistryResponse;

export type RealityNodesResponse = { nodes: NodeRecord[]; total: number };
export type RealityTrustResponse = { trust: TrustScoreRecord[]; total: number };
export type RealityProofsResponse = {
  proofs: RealityProofRecord[];
  total: number;
};
export type AiProviderHealthResponse = {
  providers: Array<{
    provider: string;
    ok: boolean;
    latencyMs: number;
    error?: string;
  }>;
  total: number;
};

export function getAccountProfile() {
  return apiJsonRequest<OmAiAccountProfile>(
    "/v1/account/profile",
    {
      method: "GET",
    },
    "Unable to load account profile.",
  );
}

export function updateAccountProfile(input: Partial<OmAiAccountProfile>) {
  return apiJsonRequest<OmAiAccountProfile>(
    "/v1/account/profile",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    "Unable to update account profile.",
  );
}

export function getAccountPreferences() {
  return apiJsonRequest<OmAiAccountPreferences>(
    "/v1/account/preferences",
    {
      method: "GET",
    },
    "Unable to load account preferences.",
  );
}

export function updateAccountPreferences(
  input: Partial<OmAiAccountPreferences>,
) {
  return apiJsonRequest<OmAiAccountPreferences>(
    "/v1/account/preferences",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
    "Unable to update account preferences.",
  );
}

export function getBillingSubscriptions() {
  return apiJsonRequest<OmAiBillingSubscriptionsResponse>(
    "/v1/billing/subscriptions",
    {
      method: "GET",
    },
    "Unable to load billing subscriptions.",
  );
}

export function getBillingUsage() {
  return apiJsonRequest<OmAiBillingUsageResponse>(
    "/v1/billing/usage",
    {
      method: "GET",
    },
    "Unable to load billing usage.",
  );
}

export function getProviders() {
  return apiJsonRequest<OmAiProvidersResponse>(
    "/v1/providers",
    {
      method: "GET",
    },
    "Unable to load provider registry.",
  );
}

export function getProviderRoute(capability: OmAiProviderCapabilityId) {
  return apiJsonRequest<OmAiProviderRouteDecision>(
    `/v1/providers/route?app=om-ai&capability=${encodeURIComponent(capability)}`,
    {
      method: "GET",
    },
    "Unable to resolve provider route.",
  );
}

export function getProviderObservability() {
  return apiJsonRequest<OmAiProviderObservabilityResponse>(
    "/v1/providers/observability",
    {
      method: "GET",
    },
    "Unable to load provider observability.",
  );
}

export function getRealityNodes() {
  return apiJsonRequest<RealityNodesResponse>(
    "/v2/reality/nodes",
    { method: "GET" },
    "Unable to load persisted nodes.",
  );
}

export function getRealityTrust() {
  return apiJsonRequest<RealityTrustResponse>(
    "/v2/reality/trust",
    { method: "GET" },
    "Unable to load trust records.",
  );
}

export function getRealityProofs() {
  return apiJsonRequest<RealityProofsResponse>(
    "/v2/reality/proofs",
    { method: "GET" },
    "Unable to load proof records.",
  );
}

export function getAiProviderHealth() {
  return apiJsonRequest<AiProviderHealthResponse>(
    "/v1/ai/health",
    { method: "GET" },
    "Unable to load AI provider health.",
  );
}
