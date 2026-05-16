import { describe, expect, it } from "vitest";
import app from "./index";
import {
  resetOmAiProviderRegistryState,
  setOmAiProviderRegistryState,
} from "./provider-registry";

const env = {
  ENVIRONMENT: "test",
  MAGIC_LINK_SECRET: "test_magic_secret_for_provider_routes",
};

async function createAccessToken(email = "operator@omdala.com") {
  const payload = {
    email,
    type: "access" as const,
    exp: Date.now() + 60 * 60 * 1000,
  };

  const payloadPart = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.MAGIC_LINK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadPart),
  );
  const signaturePart = Buffer.from(new Uint8Array(signature)).toString(
    "base64url",
  );

  return `${payloadPart}.${signaturePart}`;
}

async function withAuthHeaders() {
  const token = await createAccessToken();
  return {
    cookie: `omdala_access_token=${token}`,
  };
}

describe("v1/provider routes", () => {
  it("returns observability payload for authenticated session", async () => {
    resetOmAiProviderRegistryState();
    const headers = await withAuthHeaders();
    const response = await app.request(
      "http://localhost/v1/providers/observability",
      { headers },
      env,
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        appId: string;
        source: string;
        providers: Array<{ id: string; p95LatencyMs: number | null }>;
        routeDecisions: Array<{ capability: string }>;
        summary: { totalProviders: number };
      };
    };

    expect(json.ok).toBe(true);
    expect(json.data.appId).toBe("om-ai");
    expect(json.data.source).toBe("memory-store");
    expect(json.data.summary.totalProviders).toBeGreaterThan(0);
    expect(json.data.providers.some((provider) => provider.id === "openai-realtime")).toBe(true);
    expect(json.data.routeDecisions.some((decision) => decision.capability === "live-call")).toBe(true);
  });

  it("returns provider registry for authenticated session", async () => {
    resetOmAiProviderRegistryState();
    const headers = await withAuthHeaders();
    const response = await app.request(
      "http://localhost/v1/providers",
      { headers },
      env,
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        appId: string;
        total: number;
        items: Array<{ id: string }>;
      };
    };
    expect(json.ok).toBe(true);
    expect(json.data.appId).toBe("om-ai");
    expect(json.data.total).toBeGreaterThan(0);
    expect(json.data.items.some((provider) => provider.id === "openai-realtime")).toBe(true);
  });

  it("returns 422 for unsupported app id", async () => {
    resetOmAiProviderRegistryState();
    const headers = await withAuthHeaders();
    const response = await app.request(
      "http://localhost/v1/providers/route?app=omniverse&capability=live-call",
      { headers },
      env,
    );

    expect(response.status).toBe(422);
    const json = (await response.json()) as {
      ok: boolean;
      error?: { code: string };
    };
    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("unsupported_app");
  });

  it("returns 422 for invalid capability", async () => {
    resetOmAiProviderRegistryState();
    const headers = await withAuthHeaders();
    const response = await app.request(
      "http://localhost/v1/providers/route?app=om-ai&capability=invalid-capability",
      { headers },
      env,
    );

    expect(response.status).toBe(422);
    const json = (await response.json()) as {
      ok: boolean;
      error?: { code: string };
    };
    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("invalid_capability");
  });

  it("returns runtime-scored route decision for live-call", async () => {
    resetOmAiProviderRegistryState();
    const headers = await withAuthHeaders();
    const response = await app.request(
      "http://localhost/v1/providers/route?app=om-ai&capability=live-call",
      { headers },
      env,
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        capability: string;
        providerId: string | null;
        fallbackProviderId: string | null;
        score: number;
      };
    };
    expect(json.ok).toBe(true);
    expect(json.data.capability).toBe("live-call");
    expect(json.data.providerId).toBe("openai-realtime");
    expect(json.data.fallbackProviderId).toBe("fallback-mock");
    expect(json.data.score).toBeGreaterThan(0);
  });

  it("returns no provider when all matching providers are down", async () => {
    setOmAiProviderRegistryState({
      items: [
        {
          id: "openai-realtime",
          name: "OpenAI Realtime",
          capabilities: ["live-call"],
          priority: 1,
          health: "down",
        },
        {
          id: "fallback-mock",
          name: "Fallback Mock Provider",
          capabilities: ["live-call"],
          priority: 99,
          health: "down",
        },
      ],
      runtimeMetrics: [
        {
          providerId: "openai-realtime",
          p95LatencyMs: 1200,
          errorRate: 1,
        },
        {
          providerId: "fallback-mock",
          p95LatencyMs: 1400,
          errorRate: 1,
        },
      ],
    });

    const headers = await withAuthHeaders();
    const response = await app.request(
      "http://localhost/v1/providers/route?app=om-ai&capability=live-call",
      { headers },
      env,
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        providerId: string | null;
        fallbackProviderId: string | null;
        score: number;
      };
    };

    expect(json.ok).toBe(true);
    expect(json.data.providerId).toBeNull();
    expect(json.data.fallbackProviderId).toBeNull();
    expect(json.data.score).toBe(0);

    resetOmAiProviderRegistryState();
  });

  it("returns null fallback when only one provider can satisfy a capability", async () => {
    setOmAiProviderRegistryState({
      items: [
        {
          id: "openai-responses",
          name: "OpenAI Responses",
          capabilities: ["recap-generation"],
          priority: 1,
          health: "healthy",
        },
      ],
      runtimeMetrics: [
        {
          providerId: "openai-responses",
          p95LatencyMs: 410,
          errorRate: 0.004,
        },
      ],
    });

    const headers = await withAuthHeaders();
    const response = await app.request(
      "http://localhost/v1/providers/route?app=om-ai&capability=recap-generation",
      { headers },
      env,
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      ok: boolean;
      data: {
        providerId: string | null;
        fallbackProviderId: string | null;
      };
    };

    expect(json.ok).toBe(true);
    expect(json.data.providerId).toBe("openai-responses");
    expect(json.data.fallbackProviderId).toBeNull();

    resetOmAiProviderRegistryState();
  });

  it("rejects invalid query matrix before capability validation when app is unsupported", async () => {
    resetOmAiProviderRegistryState();
    const headers = await withAuthHeaders();
    const response = await app.request(
      "http://localhost/v1/providers/route?app=omniverse&capability=invalid-capability",
      { headers },
      env,
    );

    expect(response.status).toBe(422);
    const json = (await response.json()) as {
      ok: boolean;
      error?: { code: string };
    };

    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("unsupported_app");
  });
});
