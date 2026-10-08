import type {
  AnalyticsEventEnvelope,
  OmAiBillingSubscription,
  SharedNotificationRecord,
  WorkspaceRecord,
} from "@omdala/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const clientMocks = vi.hoisted(() => ({ queryRows: vi.fn() }));

vi.mock("./client", () => ({ queryRows: clientMocks.queryRows }));

import {
  createAnalyticsEvent,
  createWorkspace,
  listOrCreateAnalyticsEvents,
  listOrCreateNotifications,
  listOrCreateWorkspaces,
  markNotificationRead,
  readBillingUsageMinutesToday,
  readOrCreateBillingSubscription,
} from "./runtime-repository";

const env = {
  ENVIRONMENT: "test",
  DATABASE_URL: "postgresql://example.test/omdala",
};
const ownerEmail = "runtime-owner@omdala.com";
const createdAt = "2026-10-08T01:02:03.000Z";

const subscription: OmAiBillingSubscription = {
  id: "sub_runtime_owner",
  appId: "om-ai",
  planId: "om-ai-free",
  status: "active",
  billingCycle: "monthly",
};

const workspace: WorkspaceRecord = {
  id: "ws_runtime_owner",
  slug: "runtime-owner-workspace",
  name: "Runtime Owner Workspace",
  type: "organization",
  timezone: "UTC",
  locale: "en",
  ownerId: "user_runtime_owner",
  members: [
    {
      userId: "user_runtime_owner",
      role: "owner",
      status: "active",
      joinedAt: createdAt,
    },
  ],
  createdAt,
  updatedAt: createdAt,
};

const workspaceRow = {
  id: workspace.id,
  slug: workspace.slug,
  name: workspace.name,
  workspace_type: workspace.type,
  timezone: workspace.timezone,
  locale: workspace.locale,
  owner_id: workspace.ownerId,
  members: workspace.members,
  created_at: createdAt,
  updated_at: createdAt,
};

const notification: SharedNotificationRecord = {
  id: "notif_runtime",
  userId: workspace.ownerId,
  workspaceId: workspace.id,
  type: "system",
  title: "Runtime persisted",
  body: "Protected runtime state is durable.",
  appId: "omdala-platform",
  deeplink: "/app/settings",
  createdAt,
};

const notificationRow = {
  id: notification.id,
  user_id: notification.userId,
  workspace_id: notification.workspaceId,
  notification_type: notification.type,
  title: notification.title,
  body: notification.body,
  app_id: notification.appId,
  deeplink: notification.deeplink,
  read_at: null,
  created_at: createdAt,
};

const event: AnalyticsEventEnvelope = {
  id: "evt_runtime",
  appId: "om-ai",
  eventName: "om-ai.usage.minute-recorded",
  userId: workspace.ownerId,
  workspaceId: workspace.id,
  sessionId: "session-runtime",
  source: "api",
  occurredAt: createdAt,
  properties: { minutes: 2.5 },
};

const eventRow = {
  id: event.id,
  app_id: event.appId,
  event_name: event.eventName,
  user_id: event.userId,
  workspace_id: event.workspaceId,
  session_id: event.sessionId,
  event_source: event.source,
  occurred_at: createdAt,
  properties: event.properties,
};

describe("protected runtime PostgreSQL repository", () => {
  beforeEach(() => {
    clientMocks.queryRows.mockReset();
  });

  it("reads or creates the subscription in the authenticated owner scope", async () => {
    clientMocks.queryRows.mockResolvedValueOnce([
      {
        id: subscription.id,
        app_id: subscription.appId,
        plan_id: subscription.planId,
        status: subscription.status,
        billing_cycle: subscription.billingCycle,
        expires_at: null,
      },
    ]);

    await expect(
      readOrCreateBillingSubscription(env, ownerEmail, subscription),
    ).resolves.toEqual(subscription);
    expect(clientMocks.queryRows.mock.calls[0]?.[1]).toContain(
      "omdala.billing_subscriptions",
    );
    expect(clientMocks.queryRows.mock.calls[0]?.[2]).toContain(ownerEmail);
  });

  it("aggregates daily usage in PostgreSQL under the exact owner and event", async () => {
    clientMocks.queryRows.mockResolvedValueOnce([{ used_minutes: "12.5" }]);

    await expect(
      readBillingUsageMinutesToday(env, ownerEmail, event.eventName),
    ).resolves.toBe(12.5);
    expect(clientMocks.queryRows.mock.calls[0]?.[1]).toContain(
      "FROM omdala.analytics_events",
    );
    expect(clientMocks.queryRows.mock.calls[0]?.[2]).toEqual([
      ownerEmail,
      event.eventName,
    ]);
  });

  it("seeds then lists workspaces without crossing owner scope", async () => {
    clientMocks.queryRows
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([workspaceRow]);

    await expect(
      listOrCreateWorkspaces(env, ownerEmail, [workspace]),
    ).resolves.toEqual([workspace]);
    expect(clientMocks.queryRows.mock.calls[1]?.[1]).toContain(
      "WHERE owner_email = $1",
    );
    expect(clientMocks.queryRows.mock.calls[1]?.[2]).toEqual([ownerEmail]);
  });

  it("creates a workspace and returns the stored database representation", async () => {
    clientMocks.queryRows.mockResolvedValueOnce([workspaceRow]);

    await expect(createWorkspace(env, ownerEmail, workspace)).resolves.toEqual(
      workspace,
    );
    expect(clientMocks.queryRows.mock.calls[0]?.[1]).toContain(
      "INSERT INTO omdala.workspaces",
    );
  });

  it("seeds notifications and marks only an owner-scoped record as read", async () => {
    clientMocks.queryRows
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([notificationRow])
      .mockResolvedValueOnce([
        { ...notificationRow, read_at: "2026-10-08T01:03:00.000Z" },
      ]);

    await expect(
      listOrCreateNotifications(env, ownerEmail, [notification]),
    ).resolves.toEqual([notification]);
    await expect(
      markNotificationRead(env, ownerEmail, notification.id),
    ).resolves.toMatchObject({
      id: notification.id,
      readAt: "2026-10-08T01:03:00.000Z",
    });
    expect(clientMocks.queryRows.mock.calls[2]?.[1]).toContain(
      "WHERE owner_email = $1 AND id = $2",
    );
    expect(clientMocks.queryRows.mock.calls[2]?.[2]).toEqual([
      ownerEmail,
      notification.id,
    ]);
  });

  it("persists and filters analytics events in the authenticated owner scope", async () => {
    clientMocks.queryRows
      .mockResolvedValueOnce([eventRow])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([eventRow]);

    await expect(createAnalyticsEvent(env, ownerEmail, event)).resolves.toEqual(
      event,
    );
    await expect(
      listOrCreateAnalyticsEvents(env, ownerEmail, [event], "om-ai"),
    ).resolves.toEqual([event]);
    expect(clientMocks.queryRows.mock.calls[2]?.[1]).toContain("app_id = $2");
    expect(clientMocks.queryRows.mock.calls[2]?.[2]).toEqual([
      ownerEmail,
      "om-ai",
    ]);
  });
});
