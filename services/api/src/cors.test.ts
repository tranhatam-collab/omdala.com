import { describe, expect, it } from "vitest";
import type { ApiBindings } from "./contracts";
import app from "./index";

const stagingEnv = {
  ENVIRONMENT: "staging",
  APP_BASE_URL: "https://app-staging.omdala.com",
  WEB_BASE_URL: "https://staging.omdala.com",
  AUTH_BASE_URL: "https://auth-staging.omdala.com",
};

async function requestFrom(origin: string, env: ApiBindings = stagingEnv) {
  return app.request(
    "https://api-staging.omdala.com/health",
    { headers: { Origin: origin } },
    env,
  );
}

describe("credentialed CORS allowlist", () => {
  it("allows the browser AI idempotency header in a staging preflight", async () => {
    const response = await app.request(
      "https://api-staging.omdala.com/v1/ai/chat",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://app-staging.omdala.com",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type,idempotency-key",
        },
      },
      stagingEnv,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://app-staging.omdala.com",
    );
    const allowedHeaders =
      response.headers.get("access-control-allow-headers")?.toLowerCase() ?? "";
    expect(allowedHeaders).toContain("content-type");
    expect(allowedHeaders).toContain("idempotency-key");
  });

  it.each([
    "https://app-staging.omdala.com",
    "https://staging.omdala.com",
    "https://auth-staging.omdala.com",
  ])("allows the exact configured origin %s", async (origin) => {
    const response = await requestFrom(origin);

    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true",
    );
  });

  it.each([
    "https://unknown.omdala.com",
    "https://app-staging.omdala.com.evil.example",
    "https://app-staging-omdala.com",
    "http://app-staging.omdala.com",
    "http://localhost:3000",
    "https://docs.omdala.com",
    "https://trust.omdala.com",
    "https://admin.omdala.com",
  ])("rejects unlisted or lookalike staging origin %s", async (origin) => {
    const response = await requestFrom(origin);

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("allows local origins only in a local environment", async () => {
    const localOrigin = "http://localhost:3000";
    const response = await requestFrom(localOrigin, {
      ...stagingEnv,
      ENVIRONMENT: "local",
    });

    expect(response.headers.get("access-control-allow-origin")).toBe(
      localOrigin,
    );
  });

  it("fails closed when an environment origin contains a path", async () => {
    const response = await requestFrom("https://app-staging.omdala.com", {
      ...stagingEnv,
      APP_BASE_URL: "https://app-staging.omdala.com/not-an-origin",
    });

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("fails closed when an environment origin contains a port", async () => {
    const origin = "https://app-staging.omdala.com:8443";
    const response = await requestFrom(origin, {
      ...stagingEnv,
      APP_BASE_URL: origin,
    });

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it.each([
    "https://app.omdala.com",
    "https://attacker.example",
  ])("rejects cross-environment or arbitrary configured staging origin %s", async (origin) => {
    const response = await requestFrom(origin, {
      ...stagingEnv,
      APP_BASE_URL: origin,
    });

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("rejects stale dashboard origins that override production bindings", async () => {
    const response = await requestFrom("https://attacker.example", {
      ENVIRONMENT: "production",
      APP_BASE_URL: "https://attacker.example",
      WEB_BASE_URL: "https://omdala.com",
      AUTH_BASE_URL: "https://auth.omdala.com",
    });

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("does not fall back to a production surface when staging config is absent", async () => {
    const { APP_BASE_URL: _omitted, ...incompleteStagingEnv } = stagingEnv;
    const response = await requestFrom(
      "https://app.omdala.com",
      incompleteStagingEnv,
    );

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it.each([
    "https://docs.omdala.com",
    "https://trust.omdala.com",
    "https://admin.omdala.com",
  ])("allows fixed operational origin %s only in production", async (origin) => {
    const response = await requestFrom(origin, { ENVIRONMENT: "production" });

    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
  });
});
