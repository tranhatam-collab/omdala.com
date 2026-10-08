import type {
  AnalyticsEventEnvelope,
  OmAiAccountProfile,
  WorkspaceRecord,
} from "@omdala/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DbQueryError } from "./db/errors";

const authMocks = vi.hoisted(() => ({ isAuthSessionActive: vi.fn() }));
const accountMocks = vi.hoisted(() => ({
  readOrCreateAccountProfile: vi.fn(),
}));
const runtimeMocks = vi.hoisted(() => ({
  createAnalyticsEvent: vi.fn(),
  createWorkspace: vi.fn(),
  listOrCreateAnalyticsEvents: vi.fn(),
  listOrCreateNotifications: vi.fn(),
  listOrCreateWorkspaces: vi.fn(),
  markNotificationRead: vi.fn(),
  readBillingUsageMinutesToday: vi.fn(),
  readOrCreateBillingSubscription: vi.fn(),
}));

vi.mock("./db/auth-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/auth-repository")>()),
  isAuthSessionActive: authMocks.isAuthSessionActive,
}));

vi.mock("./db/account-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/account-repository")>()),
  readOrCreateAccountProfile: accountMocks.readOrCreateAccountProfile,
}));

vi.mock("./db/runtime-repository", () => runtimeMocks);

import app from "./index";

const secret = "protected_runtime_persistence_test_secret";
const email = "protected-runtime@omdala.com";
const profile: OmAiAccountProfile = {
  id: "user_protected_runtime",
  email,
  displayName: "Protected Runtime",
  timezone: "UTC",
  locale: "en",
};
const workspace: WorkspaceRecord = {
  id: "ws_protected_runtime",
  slug: "protected-runtime",
  name: "Protected Runtime",
  type: "organization",
  timezone: "UTC",
  locale: "en",
  ownerId: profile.id,
  members: [
    {
      userId: profile.id,
      role: "owner",
      status: "active",
      joinedAt: "2026-10-08T01:00:00.000Z",
    },
  ],
  createdAt: "2026-10-08T01:00:00.000Z",
  updatedAt: "2026-10-08T01:00:00.000Z",
};

async function bearer(): Promise<string> {
  const payload = {
    email,
    type: "access",
    exp: Date.now() + 60_000,
    jti: "11111111-1111-4111-8111-111111111111",
    sid: "22222222-2222-4222-8222-222222222222",
  };
  const payloadPart = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadPart),
  );
  return `${payloadPart}.${Buffer.from(new Uint8Array(signature)).toString("base64url")}`;
}

async function headers() {
  return { authorization: `Bearer ${await bearer()}` };
}

describe("protected runtime API persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.isAuthSessionActive.mockResolvedValue(true);
    accountMocks.readOrCreateAccountProfile.mockResolvedValue(profile);
  });

  it("fails closed outside explicit test/development modes when PostgreSQL is absent", async () => {
    const response = await app.request(
      "http://localhost/v1/billing/subscriptions",
      { headers: await headers() },
      { ENVIRONMENT: "staging", MAGIC_LINK_SECRET: secret },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "PERSISTENCE_REQUIRED" },
    });
    expect(runtimeMocks.readOrCreateBillingSubscription).not.toHaveBeenCalled();
  });

  it("maps a persistent billing query failure without using in-memory usage", async () => {
    runtimeMocks.readBillingUsageMinutesToday.mockRejectedValueOnce(
      new DbQueryError({
        kind: "unavailable",
        message: "connection terminated",
        sqlState: "08006",
        operation: "readBillingUsageMinutesToday",
      }),
    );

    const response = await app.request(
      "http://localhost/v1/billing/usage",
      { headers: await headers() },
      {
        ENVIRONMENT: "production",
        MAGIC_LINK_SECRET: secret,
        DATABASE_URL: "postgresql://example.test/omdala",
      },
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "DATABASE_UNAVAILABLE" },
    });
  });

  it("lists persistent workspaces in the authenticated email scope", async () => {
    runtimeMocks.listOrCreateWorkspaces.mockResolvedValueOnce([workspace]);

    const env = {
      ENVIRONMENT: "staging",
      MAGIC_LINK_SECRET: secret,
      DATABASE_URL: "postgresql://example.test/omdala",
    };
    const response = await app.request(
      "http://localhost/v1/workspaces",
      { headers: await headers() },
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { workspaces: [{ id: workspace.id }], total: 1 },
    });
    expect(runtimeMocks.listOrCreateWorkspaces).toHaveBeenCalledWith(
      env,
      email,
      expect.any(Array),
    );
  });

  it("persists analytics events instead of appending to module state", async () => {
    const storedEvent: AnalyticsEventEnvelope = {
      id: "evt_persisted",
      appId: "omniverse",
      eventName: "omniverse.device.state.changed",
      userId: profile.id,
      source: "api",
      occurredAt: "2026-10-08T01:04:00.000Z",
      properties: { state: "on" },
    };
    runtimeMocks.createAnalyticsEvent.mockResolvedValueOnce(storedEvent);

    const env = {
      ENVIRONMENT: "staging",
      MAGIC_LINK_SECRET: secret,
      DATABASE_URL: "postgresql://example.test/omdala",
    };
    const response = await app.request(
      "http://localhost/v1/analytics/track",
      {
        method: "POST",
        headers: {
          ...(await headers()),
          "content-type": "application/json",
        },
        body: JSON.stringify({
          appId: "omniverse",
          eventName: "omniverse.device.state.changed",
          source: "api",
          properties: { state: "on" },
        }),
      },
      env,
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { accepted: true, eventId: storedEvent.id },
    });
    expect(runtimeMocks.createAnalyticsEvent).toHaveBeenCalledWith(
      env,
      email,
      expect.objectContaining({
        appId: "omniverse",
        eventName: "omniverse.device.state.changed",
        userId: profile.id,
      }),
    );
  });
});
