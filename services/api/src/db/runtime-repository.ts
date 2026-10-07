import type {
  AnalyticsEventEnvelope,
  OmAiBillingSubscription,
  SharedNotificationRecord,
  WorkspaceRecord,
} from "@omdala/types";
import type { ApiBindings } from "../contracts";
import { queryRows } from "./client";
import { toDbQueryError } from "./errors";

type SqlRow = Record<string, unknown>;

async function withDbContext<T>(
  operation: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toDbQueryError(error, operation);
  }
}

function iso(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function jsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function mapSubscription(row: SqlRow): OmAiBillingSubscription {
  const subscription: OmAiBillingSubscription = {
    id: String(row.id),
    appId: row.app_id as OmAiBillingSubscription["appId"],
    planId: row.plan_id as OmAiBillingSubscription["planId"],
    status: row.status as OmAiBillingSubscription["status"],
    billingCycle:
      row.billing_cycle as OmAiBillingSubscription["billingCycle"],
  };
  if (row.expires_at) subscription.expiresAt = iso(row.expires_at);
  return subscription;
}

function mapWorkspace(row: SqlRow): WorkspaceRecord {
  const members = jsonValue(row.members);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    type: row.workspace_type as WorkspaceRecord["type"],
    timezone: String(row.timezone),
    locale: row.locale as WorkspaceRecord["locale"],
    ownerId: String(row.owner_id),
    members: Array.isArray(members)
      ? (members as WorkspaceRecord["members"])
      : [],
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapNotification(row: SqlRow): SharedNotificationRecord {
  const notification: SharedNotificationRecord = {
    id: String(row.id),
    userId: String(row.user_id),
    type: row.notification_type as SharedNotificationRecord["type"],
    title: String(row.title),
    body: String(row.body),
    appId: row.app_id as SharedNotificationRecord["appId"],
    deeplink: String(row.deeplink),
    createdAt: iso(row.created_at),
  };
  if (row.workspace_id) notification.workspaceId = String(row.workspace_id);
  if (row.read_at) notification.readAt = iso(row.read_at);
  return notification;
}

function mapAnalyticsEvent(row: SqlRow): AnalyticsEventEnvelope {
  const properties = jsonValue(row.properties);
  const event: AnalyticsEventEnvelope = {
    id: String(row.id),
    appId: row.app_id as AnalyticsEventEnvelope["appId"],
    eventName: String(row.event_name),
    source: row.event_source as AnalyticsEventEnvelope["source"],
    occurredAt: iso(row.occurred_at),
    properties:
      properties && typeof properties === "object" && !Array.isArray(properties)
        ? (properties as AnalyticsEventEnvelope["properties"])
        : {},
  };
  if (row.user_id) event.userId = String(row.user_id);
  if (row.workspace_id) event.workspaceId = String(row.workspace_id);
  if (row.session_id) event.sessionId = String(row.session_id);
  return event;
}

export async function readOrCreateBillingSubscription(
  env: ApiBindings,
  ownerEmail: string,
  fallback: OmAiBillingSubscription,
): Promise<OmAiBillingSubscription> {
  return withDbContext("readOrCreateBillingSubscription", async () => {
    const rows = (await queryRows(
      env,
      `INSERT INTO omdala.billing_subscriptions
        (id, owner_email, app_id, plan_id, status, billing_cycle, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (owner_email, app_id) DO UPDATE SET
         updated_at = omdala.billing_subscriptions.updated_at
       RETURNING id, app_id, plan_id, status, billing_cycle, expires_at`,
      [
        fallback.id,
        ownerEmail,
        fallback.appId,
        fallback.planId,
        fallback.status,
        fallback.billingCycle,
        fallback.expiresAt ?? null,
      ],
    )) as SqlRow[];
    if (!rows[0]) throw new Error("Billing subscription was not persisted");
    return mapSubscription(rows[0]);
  });
}

export async function readBillingUsageMinutesToday(
  env: ApiBindings,
  ownerEmail: string,
  eventName: string,
): Promise<number> {
  return withDbContext("readBillingUsageMinutesToday", async () => {
    const rows = (await queryRows(
      env,
      `SELECT COALESCE(SUM(
         CASE
           WHEN properties->>'minutes' ~ '^[0-9]+([.][0-9]+)?$'
             THEN (properties->>'minutes')::NUMERIC
           ELSE 0
         END
       ), 0) AS used_minutes
       FROM omdala.analytics_events
       WHERE owner_email = $1
         AND event_name = $2
         AND occurred_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
         AND occurred_at < (date_trunc('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 day') AT TIME ZONE 'UTC'`,
      [ownerEmail, eventName],
    )) as SqlRow[];
    const value = Number(rows[0]?.used_minutes ?? 0);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("Billing usage query returned an invalid value");
    }
    return value;
  });
}

export async function listOrCreateWorkspaces(
  env: ApiBindings,
  ownerEmail: string,
  defaults: WorkspaceRecord[],
): Promise<WorkspaceRecord[]> {
  return withDbContext("listOrCreateWorkspaces", async () => {
    for (const workspace of defaults) {
      await queryRows(
        env,
        `INSERT INTO omdala.workspaces
          (id, owner_email, slug, name, workspace_type, timezone, locale,
           owner_id, members, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::JSONB, $10, $11)
         ON CONFLICT (owner_email, slug) DO NOTHING`,
        [
          workspace.id,
          ownerEmail,
          workspace.slug,
          workspace.name,
          workspace.type,
          workspace.timezone,
          workspace.locale,
          workspace.ownerId,
          JSON.stringify(workspace.members),
          workspace.createdAt,
          workspace.updatedAt,
        ],
      );
    }
    const rows = (await queryRows(
      env,
      `SELECT id, slug, name, workspace_type, timezone, locale, owner_id,
              members, created_at, updated_at
       FROM omdala.workspaces
       WHERE owner_email = $1
       ORDER BY created_at ASC, id ASC`,
      [ownerEmail],
    )) as SqlRow[];
    return rows.map(mapWorkspace);
  });
}

export async function createWorkspace(
  env: ApiBindings,
  ownerEmail: string,
  workspace: WorkspaceRecord,
): Promise<WorkspaceRecord> {
  return withDbContext("createWorkspace", async () => {
    const rows = (await queryRows(
      env,
      `INSERT INTO omdala.workspaces
        (id, owner_email, slug, name, workspace_type, timezone, locale,
         owner_id, members, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::JSONB, $10, $11)
       RETURNING id, slug, name, workspace_type, timezone, locale, owner_id,
                 members, created_at, updated_at`,
      [
        workspace.id,
        ownerEmail,
        workspace.slug,
        workspace.name,
        workspace.type,
        workspace.timezone,
        workspace.locale,
        workspace.ownerId,
        JSON.stringify(workspace.members),
        workspace.createdAt,
        workspace.updatedAt,
      ],
    )) as SqlRow[];
    if (!rows[0]) throw new Error("Workspace insert returned no row");
    return mapWorkspace(rows[0]);
  });
}

export async function listOrCreateNotifications(
  env: ApiBindings,
  ownerEmail: string,
  defaults: SharedNotificationRecord[],
): Promise<SharedNotificationRecord[]> {
  return withDbContext("listOrCreateNotifications", async () => {
    for (const notification of defaults) {
      await queryRows(
        env,
        `INSERT INTO omdala.shared_notifications
          (id, owner_email, user_id, workspace_id, notification_type, title,
           body, app_id, deeplink, read_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (owner_email, id) DO NOTHING`,
        [
          notification.id,
          ownerEmail,
          notification.userId,
          notification.workspaceId ?? null,
          notification.type,
          notification.title,
          notification.body,
          notification.appId,
          notification.deeplink,
          notification.readAt ?? null,
          notification.createdAt,
        ],
      );
    }
    const rows = (await queryRows(
      env,
      `SELECT id, user_id, workspace_id, notification_type, title, body,
              app_id, deeplink, read_at, created_at
       FROM omdala.shared_notifications
       WHERE owner_email = $1
       ORDER BY created_at DESC, id ASC`,
      [ownerEmail],
    )) as SqlRow[];
    return rows.map(mapNotification);
  });
}

export async function markNotificationRead(
  env: ApiBindings,
  ownerEmail: string,
  notificationId: string,
): Promise<SharedNotificationRecord | null> {
  return withDbContext("markNotificationRead", async () => {
    const rows = (await queryRows(
      env,
      `UPDATE omdala.shared_notifications
       SET read_at = COALESCE(read_at, NOW())
       WHERE owner_email = $1 AND id = $2
       RETURNING id, user_id, workspace_id, notification_type, title, body,
                 app_id, deeplink, read_at, created_at`,
      [ownerEmail, notificationId],
    )) as SqlRow[];
    return rows[0] ? mapNotification(rows[0]) : null;
  });
}

export async function listOrCreateAnalyticsEvents(
  env: ApiBindings,
  ownerEmail: string,
  defaults: AnalyticsEventEnvelope[],
  appId?: AnalyticsEventEnvelope["appId"],
): Promise<AnalyticsEventEnvelope[]> {
  return withDbContext("listOrCreateAnalyticsEvents", async () => {
    for (const event of defaults) {
      await queryRows(
        env,
        `INSERT INTO omdala.analytics_events
          (id, owner_email, app_id, event_name, user_id, workspace_id,
           session_id, event_source, occurred_at, properties)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::JSONB)
         ON CONFLICT (owner_email, id) DO NOTHING`,
        [
          event.id,
          ownerEmail,
          event.appId,
          event.eventName,
          event.userId ?? null,
          event.workspaceId ?? null,
          event.sessionId ?? null,
          event.source,
          event.occurredAt,
          JSON.stringify(event.properties),
        ],
      );
    }
    const params: unknown[] = [ownerEmail];
    const appFilter = appId ? " AND app_id = $2" : "";
    if (appId) params.push(appId);
    const rows = (await queryRows(
      env,
      `SELECT id, app_id, event_name, user_id, workspace_id, session_id,
              event_source, occurred_at, properties
       FROM omdala.analytics_events
       WHERE owner_email = $1${appFilter}
       ORDER BY occurred_at DESC, id ASC
       LIMIT 10000`,
      params,
    )) as SqlRow[];
    return rows.map(mapAnalyticsEvent);
  });
}

export async function createAnalyticsEvent(
  env: ApiBindings,
  ownerEmail: string,
  event: AnalyticsEventEnvelope,
): Promise<AnalyticsEventEnvelope> {
  return withDbContext("createAnalyticsEvent", async () => {
    const rows = (await queryRows(
      env,
      `INSERT INTO omdala.analytics_events
        (id, owner_email, app_id, event_name, user_id, workspace_id,
         session_id, event_source, occurred_at, properties)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::JSONB)
       RETURNING id, app_id, event_name, user_id, workspace_id, session_id,
                 event_source, occurred_at, properties`,
      [
        event.id,
        ownerEmail,
        event.appId,
        event.eventName,
        event.userId ?? null,
        event.workspaceId ?? null,
        event.sessionId ?? null,
        event.source,
        event.occurredAt,
        JSON.stringify(event.properties),
      ],
    )) as SqlRow[];
    if (!rows[0]) throw new Error("Analytics event insert returned no row");
    return mapAnalyticsEvent(rows[0]);
  });
}
