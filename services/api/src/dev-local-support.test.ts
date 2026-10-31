import { describe, expect, it } from "vitest";
import app from "./index";

const SECRET = "dev_reset_secret_dev_reset_secret_0123456789";
const post = (path: string, env: object, headers: Record<string, string> = {}) =>
  app.request(`http://localhost${path}`, { method: "POST", headers }, env);

let n = 0;
// Magic-link requests are limited per address before anything else happens, so the
// sixth request for one address is a 429 in every environment.
async function exhaustMagicLinkLimit(env: object) {
  n += 1;
  const email = `limited-${n}@example.test`;
  const headers = { "content-type": "application/json", "cf-connecting-ip": `198.51.100.${n}` };
  const send = () =>
    app.request(
      "http://localhost/v1/auth/magic-link/request",
      { method: "POST", headers, body: JSON.stringify({ email }) },
      env,
    );
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) statuses.push((await send()).status);
  expect(statuses[5]).toBe(429);
  return send;
}

describe("development-only rate limit reset", () => {
  const dev = { ENVIRONMENT: "development", E2E_TEST_SECRET: SECRET };

  it("clears the limiter for a caller with the generated secret", async () => {
    const send = await exhaustMagicLinkLimit(dev);
    expect((await send()).status).toBe(429);
    const reset = await post("/v1/_dev/reset-rate-limits", dev, { "x-e2e-test-secret": SECRET });
    expect(reset.status).toBe(200);
    await expect(reset.json()).resolves.toMatchObject({ ok: true, data: { reset: true } });
    expect((await send()).status).not.toBe(429);
  });

  it.each([
    ["no credential", {}],
    ["a wrong credential", { "x-e2e-test-secret": "x".repeat(44) }],
    ["a short credential", { "x-e2e-test-secret": "short" }],
  ])("refuses %s with 401 and leaves the limiter alone", async (_label, headers) => {
    const send = await exhaustMagicLinkLimit(dev);
    const response = await post("/v1/_dev/reset-rate-limits", dev, headers);
    expect(response.status).toBe(401);
    expect((await send()).status).toBe(429);
  });

  it("answers 503 when no secret is configured, and never resets", async () => {
    const env = { ENVIRONMENT: "development" };
    const send = await exhaustMagicLinkLimit(env);
    const response = await post("/v1/_dev/reset-rate-limits", env, { "x-e2e-test-secret": SECRET });
    expect(response.status).toBe(503);
    expect((await send()).status).toBe(429);
  });
});

describe("the reset route does not exist anywhere else", () => {
  it.each(["production", "staging", "test", "local", "dev", "Development", "", undefined])(
    "ENVIRONMENT=%j answers exactly like an unknown path, even with the right secret",
    async (environment) => {
      const env = { ENVIRONMENT: environment, E2E_TEST_SECRET: SECRET, MAGIC_LINK_SECRET: SECRET } as object;
      const unknown = await post("/v1/_dev/does-not-exist", env, { "x-e2e-test-secret": SECRET });
      const reset = await post("/v1/_dev/reset-rate-limits", env, { "x-e2e-test-secret": SECRET });
      expect(reset.status).toBe(404);
      expect(reset.status).toBe(unknown.status);
      expect(await reset.text()).toBe(await unknown.text());
    },
  );

  it.each(["production", "staging", "test"])(
    "ENVIRONMENT=%s: the limiter keeps limiting after a reset attempt with the right secret",
    async (environment) => {
      const env = { ENVIRONMENT: environment, E2E_TEST_SECRET: SECRET, MAGIC_LINK_SECRET: SECRET };
      const send = await exhaustMagicLinkLimit(env);
      await post("/v1/_dev/reset-rate-limits", env, { "x-e2e-test-secret": SECRET });
      expect((await send()).status).toBe(429);
    },
  );
});

describe("CORS for the staging public origins is configuration only", () => {
  const preflight = (origin: string, env: object) =>
    app.request(
      "http://localhost/v1/auth/session",
      {
        method: "OPTIONS",
        headers: { origin, "access-control-request-method": "GET", "access-control-request-headers": "content-type" },
      },
      env,
    );
  const stagingOrigins = [
    "https://staging.omdala.com",
    "https://app-staging.omdala.com",
    "https://auth-staging.omdala.com",
  ];
  const configured = {
    ENVIRONMENT: "development",
    WEB_BASE_URL: stagingOrigins[0],
    APP_BASE_URL: stagingOrigins[1],
    AUTH_BASE_URL: stagingOrigins[2],
  };

  it.each(stagingOrigins)("development with the staging origins configured allows %s with credentials", async (origin) => {
    const response = await preflight(origin, configured);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("does not allow other origins in that setup", async () => {
    for (const origin of ["https://evil.example", "https://app.omdala.com", "http://app-staging.omdala.com"]) {
      expect((await preflight(origin, configured)).headers.get("access-control-allow-origin")).toBeNull();
    }
  });

  it("development with loopback base URLs (the default stand-up) does not allow them", async () => {
    const loopback = {
      ENVIRONMENT: "development",
      WEB_BASE_URL: "http://127.0.0.1:1",
      APP_BASE_URL: "http://127.0.0.1:1",
      AUTH_BASE_URL: "http://127.0.0.1:1",
    };
    for (const origin of stagingOrigins) {
      expect((await preflight(origin, loopback)).headers.get("access-control-allow-origin")).toBeNull();
    }
  });

  it("staging and production keep their fixed allowlists (unchanged)", async () => {
    // staging misconfigured with loopback URLs allows nothing, as before
    expect(
      (await preflight(stagingOrigins[1]!, { ENVIRONMENT: "staging", APP_BASE_URL: "http://127.0.0.1:1" })).headers.get(
        "access-control-allow-origin",
      ),
    ).toBeNull();
    // staging configured correctly allows exactly its three origins
    const staging = { ENVIRONMENT: "staging", WEB_BASE_URL: stagingOrigins[0], APP_BASE_URL: stagingOrigins[1], AUTH_BASE_URL: stagingOrigins[2] };
    expect((await preflight(stagingOrigins[1]!, staging)).headers.get("access-control-allow-origin")).toBe(stagingOrigins[1]);
    expect((await preflight("https://app.omdala.com", staging)).headers.get("access-control-allow-origin")).toBeNull();
    // production allows the production origins, not the staging ones
    expect((await preflight("https://app.omdala.com", { ENVIRONMENT: "production" })).headers.get("access-control-allow-origin")).toBe("https://app.omdala.com");
    expect((await preflight(stagingOrigins[1]!, { ENVIRONMENT: "production" })).headers.get("access-control-allow-origin")).toBeNull();
  });
});
