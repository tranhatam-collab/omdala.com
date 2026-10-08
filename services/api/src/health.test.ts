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

const runtimeVersionId = "11111111-1111-4111-8111-111111111111";
const runtimeVersionMetadata = { id: runtimeVersionId };
const completeSchemaRow = {
  nodes: "omdala.nodes",
  proofs: "omdala.proofs",
  account_profiles: "omdala.account_profiles",
  account_preferences: "omdala.account_preferences",
  billing_subscriptions: "omdala.billing_subscriptions",
  workspaces: "omdala.workspaces",
  shared_notifications: "omdala.shared_notifications",
  analytics_events: "omdala.analytics_events",
  auth_magic_links: "omdala.auth_magic_links",
  auth_sessions: "omdala.auth_sessions",
  auth_session_migration: true,
  protected_runtime_migration: true,
  nodes_owner_email_locked: true,
  proofs_owner_email_locked: true,
};

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
        DEPLOYMENT_ID: "forged-deploy-42",
        VERSION_METADATA: runtimeVersionMetadata,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      environment: "staging",
      release_sha: "abc123",
      version_id: runtimeVersionId,
      deployment_id: runtimeVersionId,
    });
  });

  it("publishes the exact staging consumer identity without touching dependencies", async () => {
    const response = await app.request(
      "http://localhost/health/version",
      {},
      {
        ENVIRONMENT: "staging",
        RELEASE_SHA: "0123456789abcdef0123456789abcdef01234567",
        DEPLOYMENT_ID: "forged-deploy-42",
        VERSION_METADATA: runtimeVersionMetadata,
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: {
        service: "omdala-api",
        environment: "staging",
        source_sha: "0123456789abcdef0123456789abcdef01234567",
        version_id: runtimeVersionId,
        deployment_id: runtimeVersionId,
      },
    });
    expect(dbMocks.queryRows).not.toHaveBeenCalled();
  });

  it("fails closed when the staging consumer identity is incomplete", async () => {
    const response = await app.request(
      "http://localhost/health/version",
      {},
      {
        ENVIRONMENT: "staging",
        RELEASE_SHA: "abc123",
        DEPLOYMENT_ID: "forged-deploy-42",
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      data: {
        environment: "staging",
        source_sha: "abc123",
        deployment_id: null,
      },
    });
  });

  it("fails closed when the consumer SHA or environment is not release-grade", async () => {
    for (const env of [
      {
        ENVIRONMENT: "staging",
        RELEASE_SHA: "abc123",
        VERSION_METADATA: runtimeVersionMetadata,
      },
      {
        ENVIRONMENT: "test",
        RELEASE_SHA: "0123456789abcdef0123456789abcdef01234567",
        DEPLOYMENT_ID: "deploy-42",
      },
    ]) {
      const response = await app.request(
        "http://localhost/health/version",
        {},
        env,
      );
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toMatchObject({ ok: false });
    }
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
        billing_subscriptions: null,
        workspaces: null,
        shared_notifications: null,
        analytics_events: null,
        protected_runtime_migration: false,
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
        VERSION_METADATA: runtimeVersionMetadata,
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
    dbMocks.queryRows.mockResolvedValueOnce([completeSchemaRow]);

    const response = await app.request(
      "http://localhost/health/deep",
      {},
      {
        ENVIRONMENT: "staging",
        RELEASE_SHA: "abc123",
        VERSION_METADATA: runtimeVersionMetadata,
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
      { ...completeSchemaRow, nodes_owner_email_locked: false },
    ]);

    const response = await app.request(
      "http://localhost/health/deep",
      {},
      {
        ENVIRONMENT: "staging",
        RELEASE_SHA: "abc123",
        VERSION_METADATA: runtimeVersionMetadata,
        DATABASE_URL: "postgresql://example.test/omdala",
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      checks: { database: "ok", schema: "missing" },
    });
  });

  it("fails closed when the protected runtime migration receipt is absent", async () => {
    dbMocks.queryRows.mockResolvedValueOnce([
      { ...completeSchemaRow, protected_runtime_migration: false },
    ]);

    const response = await app.request(
      "http://localhost/health/deep",
      {},
      {
        ENVIRONMENT: "staging",
        RELEASE_SHA: "abc123",
        VERSION_METADATA: runtimeVersionMetadata,
        DATABASE_URL: "postgresql://example.test/omdala",
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      checks: { database: "ok", schema: "missing" },
    });
  });

  it("fails closed when the authentication authority migration is absent", async () => {
    dbMocks.queryRows.mockResolvedValueOnce([
      { ...completeSchemaRow, auth_session_migration: false },
    ]);

    const response = await app.request(
      "http://localhost/health/deep",
      {},
      {
        ENVIRONMENT: "staging",
        RELEASE_SHA: "abc123",
        VERSION_METADATA: runtimeVersionMetadata,
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
