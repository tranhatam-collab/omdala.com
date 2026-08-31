import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  queryRows: vi.fn(),
}));

vi.mock("./db/client", () => ({
  isDatabaseConfigured: (env: { DATABASE_URL?: string; HYPERDRIVE?: unknown }) =>
    Boolean(env.DATABASE_URL || env.HYPERDRIVE),
  queryRows: dbMocks.queryRows,
}));

import app from "./index";

describe("release health routes", () => {
  beforeEach(() => {
    dbMocks.queryRows.mockReset();
  });

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

  it("fails closed when the database is reachable but runtime tables are missing", async () => {
    dbMocks.queryRows.mockResolvedValueOnce([
      {
        nodes: "omdala.nodes",
        proofs: "omdala.proofs",
        account_profiles: null,
        account_preferences: null,
        nodes_owner_email_locked: true,
        proofs_owner_email_locked: true,
      },
    ]);

    const response = await app.request(
      "http://localhost/health/deep",
      {},
      {
        ENVIRONMENT: "staging",
        RELEASE_SHA: "abc123",
        DEPLOYMENT_ID: "deploy-42",
        DATABASE_URL: "postgresql://example.test/omdala",
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      checks: { database: "ok", schema: "missing" },
    });
  });

  it("passes only when identity, database, and runtime schema are bound", async () => {
    dbMocks.queryRows.mockResolvedValueOnce([
      {
        nodes: "omdala.nodes",
        proofs: "omdala.proofs",
        account_profiles: "omdala.account_profiles",
        account_preferences: "omdala.account_preferences",
        nodes_owner_email_locked: true,
        proofs_owner_email_locked: true,
      },
    ]);

    const response = await app.request(
      "http://localhost/health/deep",
      {},
      {
        ENVIRONMENT: "staging",
        RELEASE_SHA: "abc123",
        DEPLOYMENT_ID: "deploy-42",
        DATABASE_URL: "postgresql://example.test/omdala",
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: "ok",
      checks: { identity: "ok", database: "ok", schema: "ok" },
    });
  });

  it("fails closed when ownership columns are not locked", async () => {
    dbMocks.queryRows.mockResolvedValueOnce([
      {
        nodes: "omdala.nodes",
        proofs: "omdala.proofs",
        account_profiles: "omdala.account_profiles",
        account_preferences: "omdala.account_preferences",
        nodes_owner_email_locked: false,
        proofs_owner_email_locked: true,
      },
    ]);

    const response = await app.request(
      "http://localhost/health/deep",
      {},
      {
        ENVIRONMENT: "staging",
        RELEASE_SHA: "abc123",
        DEPLOYMENT_ID: "deploy-42",
        DATABASE_URL: "postgresql://example.test/omdala",
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      checks: { database: "ok", schema: "missing" },
    });
  });
});
