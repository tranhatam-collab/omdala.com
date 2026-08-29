import { describe, expect, it } from "vitest";
import app from "./index";

describe("release health routes", () => {
  it("exposes an explicitly missing release identity on shallow health", async () => {
    const response = await app.request(
      "http://localhost/health",
      {},
      { ENVIRONMENT: "test" },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: "omdala-api",
      env: "test",
      environment: "test",
      release_sha: null,
      deployment_id: null,
    });
  });

  it("reports the exact release identity supplied by the deploy workflow", async () => {
    const response = await app.request(
      "http://localhost/health",
      {},
      {
        ENVIRONMENT: "staging",
        RELEASE_SHA: "abc123",
        DEPLOYMENT_ID: "deploy-42",
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      environment: "staging",
      release_sha: "abc123",
      deployment_id: "deploy-42",
    });
  });

  it("fails closed when deep-health dependencies are not configured", async () => {
    const response = await app.request(
      "http://localhost/health/deep",
      {},
      {
        ENVIRONMENT: "test",
        RELEASE_SHA: "abc123",
        DEPLOYMENT_ID: "deploy-42",
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      status: "blocked",
      release_sha: "abc123",
      deployment_id: "deploy-42",
      checks: {
        identity: "ok",
        database: "missing",
      },
    });
  });
});
