import type {
  OmAiAccountPreferences,
  OmAiAccountProfile,
  OmAiBillingSubscription,
  OmAiBillingUsage,
  OmAiAppId,
  OmAiProviderCapabilityId,
  OmAiProviderObservabilityResponse,
  OmAiProviderRegistryItem,
  OmAiProviderRegistryResponse,
  OmAiProviderRouteDecision,
  OmAiUsageEventName,
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
