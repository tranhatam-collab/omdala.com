import {
  OMDALA_API_ORIGIN,
  OMDALA_APP_ORIGIN,
  OMDALA_AUTH_ORIGIN,
  OMDALA_CONTACT_TOPICS,
  OMDALA_INBOXES,
  OMDALA_MAIL_API_ORIGIN,
  OMDALA_WEB_ORIGIN,
} from "../../../packages/core/src/mail";
import {
  OM_AI_APP_ID,
  OM_AI_PROVIDER_CAPABILITIES,
  OM_AI_FREE_DAILY_CALL_MINUTES,
  OM_AI_PLAN_IDS,
  OM_AI_USAGE_EVENT_NAMES,
} from "../../../packages/core/src";
import type {
  AnalyticsEventEnvelope,
  CommitmentRecord,
  NodeRecord,
  OmAiAccountPreferences,
  OmAiAccountProfile,
  OmAiBillingSubscription,
  OmAiBillingUsage,
  OmAiProviderCapabilityId,
  RealityProofRecord,
  SharedNotificationRecord,
  StateRecord,
  TransitionRecord,
  TrustScoreRecord,
  WorkspaceRecord,
} from "../../../packages/types/src";
import type { Context } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type {
  AccessRequest,
  ApiBindings,
  ContactRequest,
  MagicLinkPayload,
  MailRequest,
  RealityCommitmentRequest,
  RealityProofRequest,
} from "./contracts";
import {
  getOmAiProviderObservability,
  getOmAiProviderRegistryResponse,
  getOmAiProviderRouteDecision,
} from "./provider-registry";
import {
  createCommitment,
  createProof,
  getTrustByNodeId,
  listCommitments,
  listNodes,
  listProofs,
  listStates,
  listTransitions,
  listTrust,
} from "./db/reality-repository";
import {
  readOrCreateAccountPreferences,
  readOrCreateAccountProfile,
  writeAccountPreferences,
  writeAccountProfile,
} from "./db/account-repository";
import { isDatabaseConfigured, queryRows } from "./db/client";
import { DbQueryError, mapDbErrorToHttp } from "./db/errors";
import { createApiContractStub } from "./stub";
// ─── Custom Security & AI Connectors ───────────────────────────────────
import {
  buildClearCookie as buildSecureClearCookie,
  buildSecureCookie,
  createApiKeyRecord,
  createServiceToken,
  generateCsrfToken,
  getTrustedClientIp,
  RateLimiter,
  resolveAllowedOrigin,
  secureStringEqual,
  verifyServiceToken,
  verifyWebhookSignature,
} from "./security";
import {
  aiCompleteWithFallback,
  checkAiProviderHealth,
  discoverConnectors,
} from "./ai-connectors";

export type {
  AccessRequest,
  ApiBindings,
  ContactRequest,
  MagicLinkPayload,
  MailRequest,
} from "./contracts";
export type { ApiContractStubOptions } from "./stub";
export { createApiContractStub } from "./stub";

const app = new Hono<{
  Bindings: ApiBindings;
  Variables: {
    requestId: string;
    realityOwnerEmail?: string;
  };
}>();
type ApiContext = Context<{
  Bindings: ApiBindings;
  Variables: {
    requestId: string;
    realityOwnerEmail?: string;
  };
}>;
type ApiStatus =
  | 200
  | 201
  | 400
  | 401
  | 404
  | 422
  | 429
  | 500
  | 501
  | 502
  | 503
  | 504;
const rateLimiter = new RateLimiter();
const accountProfileStore = new Map<string, OmAiAccountProfile>();
const accountPreferencesStore = new Map<string, OmAiAccountPreferences>();
const billingSubscriptionStore = new Map<string, OmAiBillingSubscription>();
const workspaceStore = new Map<string, WorkspaceRecord[]>();
const sharedNotificationStore = new Map<string, SharedNotificationRecord[]>();
const analyticsEventStore = new Map<string, AnalyticsEventEnvelope[]>();

const localOrigins = [
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3004",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3004",
];

const contactTopicLabels = Object.fromEntries(
  OMDALA_CONTACT_TOPICS.map((topic) => [topic.value, topic.label]),
);
const ALLOWED_ORIGINS = new Set([
  OMDALA_WEB_ORIGIN,
  OMDALA_APP_ORIGIN,
  OMDALA_AUTH_ORIGIN,
  "https://docs.omdala.com",
  "https://trust.omdala.com",
  "https://admin.omdala.com",
  "https://*.omdala.com",
  ...localOrigins,
]);

const apiContract = createApiContractStub({
  allowedOrigins: Array.from(ALLOWED_ORIGINS),
});

function jsonError(
  c: ApiContext,
  status: ApiStatus,
  code: string,
  message: string,
) {
  const requestId = c.get("requestId") as string | undefined;
  return c.json(
    {
      ok: false,
      error: { code, message },
      meta: requestId ? { requestId } : undefined,
    },
    status,
  );
}

function jsonOk(c: ApiContext, data: unknown, status: ApiStatus = 200) {
  const requestId = c.get("requestId") as string | undefined;
  return c.json(
    {
      ok: true,
      data,
      meta: requestId ? { requestId } : undefined,
    },
    status,
  );
}

function generateRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateRequestId(c: ApiContext): string {
  const existing = c.get("requestId") as string | undefined;
  if (existing) {
    return existing;
  }

  const headerId = c.req.header("x-request-id")?.trim();
  const requestId = headerId || generateRequestId();
  c.set("requestId", requestId);
  return requestId;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getClientIp(c: ApiContext): string {
  return getTrustedClientIp(c.req.raw.headers);
}

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  return rateLimiter.isLimited(key, limit, windowMs);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function createMagicLinkToken(
  env: ApiBindings,
  payload: MagicLinkPayload,
) {
  if (!env.MAGIC_LINK_SECRET) {
    throw new Error("MAGIC_LINK_SECRET is not configured");
  }

  const payloadPart = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const key = await importHmacKey(env.MAGIC_LINK_SECRET);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadPart),
  );
  return `${payloadPart}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function verifyMagicLinkToken(env: ApiBindings, token: string) {
  try {
    if (!env.MAGIC_LINK_SECRET) {
      throw new Error("MAGIC_LINK_SECRET is not configured");
    }

    const [payloadPart, signaturePart] = token.split(".");
    if (!payloadPart || !signaturePart) {
      return null;
    }

    const key = await importHmacKey(env.MAGIC_LINK_SECRET);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signaturePart),
      new TextEncoder().encode(payloadPart),
    );

    if (!isValid) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payloadPart)),
    ) as MagicLinkPayload;

    if (!payload.email || !payload.redirectTo || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

type SessionTokenPayload = {
  email: string;
  type: "access" | "refresh";
  exp: number;
};

async function createSessionToken(
  env: ApiBindings,
  payload: SessionTokenPayload,
) {
  if (!env.MAGIC_LINK_SECRET) {
    throw new Error("MAGIC_LINK_SECRET is not configured");
  }
  const payloadPart = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const key = await importHmacKey(env.MAGIC_LINK_SECRET);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadPart),
  );
  return `${payloadPart}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function verifySessionToken(
  env: ApiBindings,
  token: string,
  expectedType: "access" | "refresh",
): Promise<SessionTokenPayload | null> {
  try {
    if (!env.MAGIC_LINK_SECRET) return null;
    const [payloadPart, signaturePart] = token.split(".");
    if (!payloadPart || !signaturePart) return null;
    const key = await importHmacKey(env.MAGIC_LINK_SECRET);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signaturePart),
      new TextEncoder().encode(payloadPart),
    );
    if (!isValid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payloadPart)),
    ) as SessionTokenPayload;
    if (payload.type !== expectedType || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getMailApiUrl(env: ApiBindings) {
  return (env.MAIL_API_URL ?? OMDALA_MAIL_API_ORIGIN).replace(/\/+$/g, "");
}

function getAppBaseUrl(env: ApiBindings) {
  return (env.APP_BASE_URL ?? OMDALA_APP_ORIGIN).replace(/\/+$/g, "");
}

function getAuthBaseUrl(env: ApiBindings) {
  return (env.AUTH_BASE_URL ?? OMDALA_AUTH_ORIGIN).replace(/\/+$/g, "");
}

function getWebBaseUrl(env: ApiBindings) {
  return (env.WEB_BASE_URL ?? OMDALA_WEB_ORIGIN).replace(/\/+$/g, "");
}

function getCookieDomain(_c: ApiContext): string | undefined {
  // Use env-specific domain if needed; default to .omdala.com for prod
  return undefined; // let browser infer (host-only) or set via env
}

function buildSetCookie(
  c: ApiContext,
  name: string,
  value: string,
  maxAgeSeconds: number,
): string {
  return buildSecureCookie({
    name,
    value,
    maxAgeSeconds,
    domain: getCookieDomain(c),
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
}

function buildClearCookie(c: ApiContext, name: string): string {
  return buildSecureClearCookie(name, getCookieDomain(c), "/");
}

function setSessionCookies(
  c: ApiContext,
  accessToken: string,
  refreshToken: string,
): void {
  c.header(
    "Set-Cookie",
    buildSetCookie(c, "omdala_access_token", accessToken, 60 * 60),
    { append: true },
  );
  c.header(
    "Set-Cookie",
    buildSetCookie(c, "omdala_refresh_token", refreshToken, 7 * 24 * 60 * 60),
    { append: true },
  );
}

function clearSessionCookies(c: ApiContext): void {
  c.header("Set-Cookie", buildClearCookie(c, "omdala_access_token"), {
    append: true,
  });
  c.header("Set-Cookie", buildClearCookie(c, "omdala_refresh_token"), {
    append: true,
  });
}

function getCookieValue(c: ApiContext, name: string): string | null {
  const raw = c.req.header("cookie");
  if (!raw) {
    return null;
  }

  const pair = raw
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!pair) {
    return null;
  }

  return pair.slice(name.length + 1);
}

function getBearerToken(c: ApiContext): string | null {
  const raw = c.req.header("authorization");
  if (!raw) {
    return null;
  }

  const [scheme, token] = raw.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function toDisplayNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "operator";
  return localPart
    .split(/[._-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toIdFromEmail(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function generateEntityId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

type ProfilePatch = Pick<
  Partial<OmAiAccountProfile>,
  "displayName" | "avatarUrl" | "bio" | "timezone" | "locale"
>;

type PreferencesPatch = {
  language?: string;
  theme?: OmAiAccountPreferences["theme"];
  notifications?: Partial<OmAiAccountPreferences["notifications"]>;
};

type AccountPatchResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

const LOCALE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(
  input: Record<string, unknown>,
  key: string,
  maxLength: number,
  allowEmpty = false,
): AccountPatchResult<string | undefined> {
  const raw = input[key];
  if (raw === undefined) return { ok: true, value: undefined };
  if (typeof raw !== "string") {
    return { ok: false, message: `${key} must be a string.` };
  }

  const value = raw.trim();
  if (!allowEmpty && value.length === 0) {
    return { ok: false, message: `${key} cannot be empty.` };
  }
  if (value.length > maxLength) {
    return { ok: false, message: `${key} must be ${maxLength} characters or fewer.` };
  }
  return { ok: true, value };
}

function validateProfilePatch(input: unknown): AccountPatchResult<ProfilePatch> {
  if (!isRecord(input)) {
    return { ok: false, message: "Profile update must be a JSON object." };
  }

  const displayName = optionalString(input, "displayName", 120);
  if (!displayName.ok) return displayName;
  const timezone = optionalString(input, "timezone", 100);
  if (!timezone.ok) return timezone;
  const locale = optionalString(input, "locale", 35);
  if (!locale.ok) return locale;
  const avatarUrl = optionalString(input, "avatarUrl", 2_048, true);
  if (!avatarUrl.ok) return avatarUrl;
  const bio = optionalString(input, "bio", 1_000, true);
  if (!bio.ok) return bio;

  if (locale.value && !LOCALE_PATTERN.test(locale.value)) {
    return { ok: false, message: "locale must be a valid BCP 47 language tag." };
  }
  if (avatarUrl.value) {
    try {
      const parsed = new URL(avatarUrl.value);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return { ok: false, message: "avatarUrl must use http or https." };
      }
    } catch {
      return { ok: false, message: "avatarUrl must be a valid URL." };
    }
  }

  return {
    ok: true,
    value: {
      ...(displayName.value !== undefined ? { displayName: displayName.value } : {}),
      ...(timezone.value !== undefined ? { timezone: timezone.value } : {}),
      ...(locale.value !== undefined ? { locale: locale.value } : {}),
      ...(avatarUrl.value !== undefined ? { avatarUrl: avatarUrl.value } : {}),
      ...(bio.value !== undefined ? { bio: bio.value } : {}),
    },
  };
}

function validatePreferencesPatch(input: unknown): AccountPatchResult<PreferencesPatch> {
  if (!isRecord(input)) {
    return { ok: false, message: "Preferences update must be a JSON object." };
  }

  const language = optionalString(input, "language", 35);
  if (!language.ok) return language;
  if (language.value && !LOCALE_PATTERN.test(language.value)) {
    return { ok: false, message: "language must be a valid BCP 47 language tag." };
  }

  const theme = input.theme;
  if (theme !== undefined && theme !== "light" && theme !== "dark" && theme !== "system") {
    return { ok: false, message: "theme must be light, dark, or system." };
  }

  const notifications = input.notifications;
  if (notifications !== undefined && !isRecord(notifications)) {
    return { ok: false, message: "notifications must be a JSON object." };
  }
  if (notifications && notifications.email !== undefined && typeof notifications.email !== "boolean") {
    return { ok: false, message: "notifications.email must be a boolean." };
  }
  if (notifications && notifications.push !== undefined && typeof notifications.push !== "boolean") {
    return { ok: false, message: "notifications.push must be a boolean." };
  }

  return {
    ok: true,
    value: {
      ...(language.value !== undefined ? { language: language.value } : {}),
      ...(theme !== undefined ? { theme } : {}),
      ...(notifications
        ? {
            notifications: {
              ...(typeof notifications.email === "boolean" ? { email: notifications.email } : {}),
              ...(typeof notifications.push === "boolean" ? { push: notifications.push } : {}),
            },
          }
        : {}),
    },
  };
}

function getDefaultAccountProfile(email: string): OmAiAccountProfile {
  return {
    id: `user_${email.toLowerCase()}`,
    email,
    displayName: toDisplayNameFromEmail(email),
    bio: "Om AI account profile sourced from the Team 1 account contract.",
    timezone: "Asia/Ho_Chi_Minh",
    locale: "vi",
  };
}

function getDefaultAccountPreferences(): OmAiAccountPreferences {
  return {
    language: "vi",
    theme: "system",
    notifications: {
      email: true,
      push: true,
    },
  };
}

function getDefaultBillingSubscription(email: string): OmAiBillingSubscription {
  return {
    id: `sub_${email.toLowerCase()}`,
    appId: OM_AI_APP_ID,
    planId: OM_AI_PLAN_IDS.free,
    status: "active",
    billingCycle: "monthly",
  };
}

function getAccountProfileForEmail(email: string): OmAiAccountProfile {
  const existing = accountProfileStore.get(email);
  if (existing) {
    return existing;
  }

  const profile = getDefaultAccountProfile(email);
  accountProfileStore.set(email, profile);
  return profile;
}

function getAccountPreferencesForEmail(email: string): OmAiAccountPreferences {
  const existing = accountPreferencesStore.get(email);
  if (existing) {
    return existing;
  }

  const preferences = getDefaultAccountPreferences();
  accountPreferencesStore.set(email, preferences);
  return preferences;
}

async function getRuntimeAccountProfile(
  env: ApiBindings,
  email: string,
): Promise<OmAiAccountProfile> {
  const fallback = getAccountProfileForEmail(email);
  if (!isDatabaseConfigured(env)) return fallback;
  return readOrCreateAccountProfile(env, fallback);
}

async function getRuntimeAccountPreferences(
  env: ApiBindings,
  email: string,
): Promise<OmAiAccountPreferences> {
  const profileFallback = getAccountProfileForEmail(email);
  const fallback = getAccountPreferencesForEmail(email);
  if (!isDatabaseConfigured(env)) return fallback;
  return readOrCreateAccountPreferences(
    env,
    email,
    profileFallback,
    fallback,
  );
}

function getBillingSubscriptionForEmail(email: string): OmAiBillingSubscription {
  const existing = billingSubscriptionStore.get(email);
  if (existing) {
    return existing;
  }

  const subscription = getDefaultBillingSubscription(email);
  billingSubscriptionStore.set(email, subscription);
  return subscription;
}

function getBillingUsageForEmail(email: string): OmAiBillingUsage {
  const events = getAnalyticsEventsForEmail(email);
  const today = new Date().toISOString().slice(0, 10);
  const usedMinutes = events
    .filter((e) => e.eventName === "om-ai.usage.minute-recorded")
    .filter((e) => e.occurredAt.startsWith(today))
    .reduce((sum, e) => {
      const properties = e.properties as Record<string, unknown> | undefined;
      return sum + Number(properties?.minutes ?? 0);
    }, 0);
  return {
    appId: OM_AI_APP_ID,
    quota: {
      callMinutesDaily: OM_AI_FREE_DAILY_CALL_MINUTES,
    },
    used: {
      callMinutesToday: usedMinutes,
    },
    remaining: {
      callMinutesToday: Math.max(
        0,
        OM_AI_FREE_DAILY_CALL_MINUTES - usedMinutes,
      ),
    },
  };
}

function getDefaultWorkspacesForEmail(email: string): WorkspaceRecord[] {
  const profile = getAccountProfileForEmail(email);
  const now = new Date().toISOString();
  const baseId = toIdFromEmail(email);
  return [
    {
      id: `ws_${baseId}`,
      slug: `${toSlug(profile.displayName || email)}-workspace`,
      name: `${profile.displayName || email} Workspace`,
      type: "organization",
      timezone: profile.timezone || "Asia/Ho_Chi_Minh",
      locale: profile.locale === "en" ? "en" : "vi",
      ownerId: profile.id,
      members: [
        {
          userId: profile.id,
          role: "owner",
          status: "active",
          joinedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function getWorkspacesForEmail(email: string): WorkspaceRecord[] {
  const existing = workspaceStore.get(email);
  if (existing) {
    return existing;
  }

  const workspaces = getDefaultWorkspacesForEmail(email);
  workspaceStore.set(email, workspaces);
  return workspaces;
}

function getDefaultNotificationsForEmail(
  email: string,
): SharedNotificationRecord[] {
  const profile = getAccountProfileForEmail(email);
  const [workspace] = getWorkspacesForEmail(email);
  const now = new Date().toISOString();
  return [
    {
      id: "notif_shared_schema_ready",
      userId: profile.id,
      ...(workspace?.id ? { workspaceId: workspace.id } : {}),
      type: "system",
      title: "Shared-core schema baseline is available",
      body: "Workspace, notifications, and analytics contracts are now available for Team 1 and Team 2 integration.",
      appId: "omdala-platform",
      deeplink: "/app/settings",
      createdAt: now,
    },
    {
      id: "notif_workspace_invite_example",
      userId: profile.id,
      ...(workspace?.id ? { workspaceId: workspace.id } : {}),
      type: "workspace_invite",
      title: "Workspace invite synced",
      body: "An invite event schema sample is ready for downstream consumers.",
      appId: "omniverse",
      deeplink: "/app/workspaces",
      readAt: now,
      createdAt: now,
    },
  ];
}

function getNotificationsForEmail(email: string): SharedNotificationRecord[] {
  const existing = sharedNotificationStore.get(email);
  if (existing) {
    return existing;
  }

  const notifications = getDefaultNotificationsForEmail(email);
  sharedNotificationStore.set(email, notifications);
  return notifications;
}

function getAnalyticsEventsForEmail(email: string): AnalyticsEventEnvelope[] {
  const existing = analyticsEventStore.get(email);
  if (existing) {
    return existing;
  }

  const profile = getAccountProfileForEmail(email);
  const [workspace] = getWorkspacesForEmail(email);
  const now = new Date().toISOString();
  const events: AnalyticsEventEnvelope[] = [
    {
      id: "evt_shared_core_bootstrap",
      appId: "omdala-platform",
      eventName: "shared_core.schema.bootstrap",
      userId: profile.id,
      ...(workspace?.id ? { workspaceId: workspace.id } : {}),
      sessionId: "session_bootstrap",
      source: "api",
      occurredAt: now,
      properties: {
        version: "2026-04-10",
        owner: "team-2",
      },
    },
  ];
  analyticsEventStore.set(email, events);
  return events;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

async function requireAuthenticatedSession(
  c: ApiContext,
): Promise<SessionTokenPayload | Response> {
  const accessToken =
    getBearerToken(c) ?? getCookieValue(c, "omdala_access_token");

  if (!accessToken) {
    return jsonError(c, 401, "unauthenticated", "Missing session token.");
  }

  const payload = await verifySessionToken(c.env, accessToken, "access");
  if (!payload) {
    return jsonError(
      c,
      401,
      "invalid_or_expired_token",
      "Session has expired.",
    );
  }

  return payload;
}

function createRealitySeed() {
  const now = new Date().toISOString();

  const nodes: NodeRecord[] = [
    {
      id: "node_business_a",
      slug: "business-a",
      nodeType: "business",
      name: "Business A",
      summary: "SME operator in Zero Overdue pilot.",
      locationText: "Ho Chi Minh City",
      visibility: "restricted_public",
      status: "active",
      primaryRole: "business",
      trustLevel: "verified",
      verificationStatus: "verified",
      proofCount: 2,
      resourceCount: 1,
    },
    {
      id: "node_customer_b",
      slug: "customer-b",
      nodeType: "person",
      name: "Customer B",
      summary: "Counterparty receiving invoice-backed commitments.",
      locationText: "Da Nang",
      visibility: "network",
      status: "active",
      primaryRole: "expert",
      trustLevel: "basic",
      verificationStatus: "pending",
      proofCount: 1,
      resourceCount: 0,
    },
  ];

  const states: StateRecord[] = [
    {
      id: "state_current_receivable",
      nodeId: "node_business_a",
      label: "Current receivable",
      summary: "Open receivable awaiting payment proof.",
      status: "current",
      updatedAt: now,
    },
    {
      id: "state_desired_paid",
      nodeId: "node_business_a",
      label: "Paid invoice",
      summary: "Invoice settled with attached payment proof.",
      status: "desired",
      updatedAt: now,
    },
  ];

  const commitments: CommitmentRecord[] = [
    {
      id: "commitment_invoice_001",
      fromNodeId: "node_business_a",
      toNodeId: "node_customer_b",
      title: "Invoice #001 payment commitment",
      summary: "Customer B pays invoice within agreed due date.",
      amount: 18000000,
      currency: "VND",
      dueAt: now,
      status: "active",
      proofIds: ["proof_payment_001"],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const transitions: TransitionRecord[] = [
    {
      id: "transition_receivable_to_paid",
      commitmentId: "commitment_invoice_001",
      nodeId: "node_business_a",
      fromStateLabel: "Current receivable",
      toStateLabel: "Paid invoice",
      summary: "Transition from overdue risk to verified payment outcome.",
      status: "planned",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const proofs: RealityProofRecord[] = [
    {
      id: "proof_payment_001",
      commitmentId: "commitment_invoice_001",
      type: "payment",
      summary: "Bank transfer receipt attached for invoice settlement.",
      verificationStatus: "pending",
      createdAt: now,
    },
  ];

  const trust: TrustScoreRecord[] = [
    {
      nodeId: "node_business_a",
      score: 78,
      level: "verified",
      explanation: [
        "Two successful proof-backed settlements.",
        "No active disputes.",
      ],
      updatedAt: now,
    },
    {
      nodeId: "node_customer_b",
      score: 61,
      level: "basic",
      explanation: [
        "Pending payment proof verification.",
        "Limited completed commitment history.",
      ],
      updatedAt: now,
    },
  ];

  const scenes = [
    {
      scene_id: "scene_sleep_child",
      display_name: "Sleep – Child's Room",
      safety_class: "safe",
      actions: [
        { device: "smart_bulb_child", command: "set_brightness", value: 0 },
        { device: "air_purifier_child", command: "set_mode", value: "sleep" },
      ],
      created_at: now,
    },
  ];

  const runs: Array<{
    run_id: string;
    source: string;
    source_id: string;
    actor_id: string;
    status: string;
    policy_decision: string;
    proof_id: string | null;
    created_at: string;
  }> = [];

  return {
    nodes,
    states,
    commitments,
    transitions,
    proofs,
    trust,
    scenes,
    runs,
  };
}

const realitySeed = createRealitySeed();

function normalizeRealityCommitment(input: RealityCommitmentRequest) {
  return {
    fromNodeId: input.fromNodeId?.trim() ?? "",
    toNodeId: input.toNodeId?.trim() ?? "",
    title: input.title?.trim() ?? "",
    summary: input.summary?.trim() ?? "",
    amount: typeof input.amount === "number" ? input.amount : undefined,
    currency: input.currency?.trim() ?? undefined,
    dueAt: input.dueAt?.trim() ?? undefined,
  };
}

function normalizeRealityProof(input: RealityProofRequest) {
  return {
    commitmentId: input.commitmentId?.trim() ?? "",
    transitionId: input.transitionId?.trim() ?? "",
    type: input.type,
    summary: input.summary?.trim() ?? "",
  };
}

function isIsoDateTimeString(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function validateCommitmentPayload(
  payload: ReturnType<typeof normalizeRealityCommitment>,
): string | null {
  if (
    !payload.fromNodeId ||
    !payload.toNodeId ||
    !payload.title ||
    !payload.summary
  ) {
    return "fromNodeId, toNodeId, title, and summary are required";
  }

  if (payload.amount !== undefined && payload.amount <= 0) {
    return "amount must be greater than 0 when provided";
  }

  if (payload.currency !== undefined && payload.currency.length > 12) {
    return "currency must be at most 12 characters";
  }

  if (payload.dueAt !== undefined && !isIsoDateTimeString(payload.dueAt)) {
    return "dueAt must be a valid ISO date/time string";
  }

  return null;
}

function validateProofPayload(
  payload: ReturnType<typeof normalizeRealityProof>,
): string | null {
  if (!payload.commitmentId && !payload.transitionId) {
    return "proof requires commitmentId or transitionId";
  }

  if (!payload.type) {
    return "proof type is required";
  }

  if (!payload.summary) {
    return "proof summary is required";
  }

  return null;
}

async function withV2Guard(
  c: ApiContext,
  handler: () => Promise<Response>,
): Promise<Response> {
  const requestId = getOrCreateRequestId(c);
  const startedAt = Date.now();
  try {
    const response = await handler();
    const durationMs = Date.now() - startedAt;
    const errorCode = await extractErrorCodeFromResponse(response);

    console.log("v2_request", {
      request_id: requestId,
      route: c.req.path,
      method: c.req.method,
      status: response.status,
      error_code: errorCode,
      duration_ms: durationMs,
    });

    return response;
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    if (error instanceof DbQueryError) {
      const mapped = mapDbErrorToHttp(error);

      console.error("v2/reality db error", {
        request_id: requestId,
        path: c.req.path,
        method: c.req.method,
        operation: error.operation,
        sql_state: error.sqlState,
        kind: error.kind,
        message: error.message,
        error_code: mapped.errorCode,
        duration_ms: durationMs,
      });

      return jsonError(c, mapped.status, mapped.errorCode, mapped.message);
    }

    const mapped = mapDbErrorToHttp(error);

    console.error("v2/reality handler error", {
      request_id: requestId,
      path: c.req.path,
      method: c.req.method,
      message: error instanceof Error ? error.message : String(error),
      error_code: mapped.errorCode,
      duration_ms: durationMs,
    });

    return jsonError(c, mapped.status, mapped.errorCode, mapped.message);
  }
}

async function extractErrorCodeFromResponse(
  response: Response,
): Promise<string> {
  if (response.status < 400) {
    return "";
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    return "";
  }

  try {
    const json = (await response.clone().json()) as {
      error?: { code?: unknown };
    };
    const code = json.error?.code;
    return typeof code === "string" ? code : "";
  } catch {
    return "";
  }
}

function hasDatabase(env: ApiBindings): boolean {
  return Boolean(env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL);
}

function requiresPersistentRealityStore(env: ApiBindings): boolean {
  return env.ENVIRONMENT === "staging" || env.ENVIRONMENT === "production";
}

function isReleasedRealityRequest(method: string, path: string): boolean {
  if (method !== "GET") return false;
  return (
    path === "/v2/reality/nodes" ||
    path === "/v2/reality/proofs" ||
    path === "/v2/reality/trust" ||
    /^\/v2\/reality\/trust\/[^/]+$/.test(path)
  );
}

function getRealityOwnerEmail(c: ApiContext): string {
  return c.get("realityOwnerEmail") ?? "local-test@omdala.invalid";
}

function accountDatabaseErrorResponse(
  c: ApiContext,
  error: unknown,
  operation: string,
): Response {
  const mapped = mapDbErrorToHttp(error);
  console.error("account database error", {
    request_id: getOrCreateRequestId(c),
    operation,
    error_code: mapped.errorCode,
    message: error instanceof Error ? error.message : String(error),
  });
  return jsonError(c, mapped.status, mapped.errorCode, mapped.message);
}

function releaseIdentity(env: ApiBindings) {
  return {
    release_sha: env.RELEASE_SHA?.trim() || null,
    deployment_id: env.DEPLOYMENT_ID?.trim() || null,
  };
}

function toCommitmentDbInput(
  payload: ReturnType<typeof normalizeRealityCommitment>,
) {
  const dbInput: {
    fromNodeId: string;
    toNodeId: string;
    title: string;
    summary: string;
    amount?: number;
    currency?: string;
    dueAt?: string;
  } = {
    fromNodeId: payload.fromNodeId,
    toNodeId: payload.toNodeId,
    title: payload.title,
    summary: payload.summary,
  };

  if (payload.amount !== undefined) {
    dbInput.amount = payload.amount;
  }
  if (payload.currency !== undefined) {
    dbInput.currency = payload.currency;
  }
  if (payload.dueAt !== undefined) {
    dbInput.dueAt = payload.dueAt;
  }

  return dbInput;
}

function toProofDbInput(payload: ReturnType<typeof normalizeRealityProof>) {
  const dbInput: {
    commitmentId?: string;
    transitionId?: string;
    type: "document" | "payment" | "behavior" | "verification";
    summary: string;
  } = {
    type: payload.type!,
    summary: payload.summary,
  };

  if (payload.commitmentId) {
    dbInput.commitmentId = payload.commitmentId;
  }
  if (payload.transitionId) {
    dbInput.transitionId = payload.transitionId;
  }

  return dbInput;
}

function applySeedTrustDeltaForProofSubmission(commitmentId: string): void {
  const commitment = realitySeed.commitments.find(
    (item) => item.id === commitmentId,
  );
  if (!commitment) {
    return;
  }

  const now = new Date().toISOString();
  const candidateNodeIds = [commitment.fromNodeId, commitment.toNodeId]
    .map((value) => value.trim())
    .filter(Boolean);

  // Immutable update: create new trust array to avoid race conditions
  const updatedTrust = [...realitySeed.trust];
  for (const nodeId of candidateNodeIds) {
    const idx = updatedTrust.findIndex((item) => item.nodeId === nodeId);
    if (idx >= 0) {
      updatedTrust[idx] = {
        ...updatedTrust[idx],
        score: Math.min(100, Number(updatedTrust[idx].score) + 0.2),
        updatedAt: now,
        explanation: [
          "Trust adjusted after proof submission.",
          "Pending verification may increase confidence further.",
        ],
      };
    } else {
      updatedTrust.unshift({
        nodeId,
        score: 50,
        level: "basic",
        explanation: [
          "Trust adjusted after proof submission.",
          "Pending verification may increase confidence further.",
        ],
        updatedAt: now,
      });
    }
  }
  realitySeed.trust = updatedTrust;
}

function allowsMailConsoleFallback(env: ApiBindings): boolean {
  return (
    env.ENVIRONMENT === "development" ||
    env.ENVIRONMENT === "local" ||
    env.ENVIRONMENT === "test"
  );
}

async function sendMail(env: ApiBindings, payload: MailRequest) {
  if (!env.MAIL_API_KEY) {
    if (allowsMailConsoleFallback(env)) {
      console.warn("[sendMail] MAIL_API_KEY not set — logging email to console (dev fallback)");
      console.log("[sendMail] To:", payload.to);
      console.log("[sendMail] Subject:", payload.subject);
      console.log("[sendMail] Text:\n", payload.text);
      return;
    }
    throw new Error("MAIL_API_KEY is not configured");
  }

  // Auto-generate idempotency key if not provided (required by IAI Mail API)
  const enrichedPayload = {
    ...payload,
    message_idempotency_key: payload.message_idempotency_key ?? crypto.randomUUID(),
    workspace_id: payload.workspace_id ?? (env.MAIL_API_WORKSPACE_ID ?? "omdala.com"),
  };

  const mailApiUrl = getMailApiUrl(env);

  // Retry up to 2 times for transient failures
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${mailApiUrl}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.MAIL_API_KEY}`,
          "Content-Type": "application/json",
          "X-Workspace-Id": env.MAIL_API_WORKSPACE_ID ?? "omdala.com",
        },
        body: JSON.stringify(enrichedPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return;
      }

      const detail = await response.text();
      // 5xx errors are retryable; 4xx are not
      if (response.status >= 500) {
        lastError = new Error(`Mail API returned ${response.status}: ${detail}`);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
      } else {
        throw new Error(`Mail API returned ${response.status}: ${detail}`);
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  if (allowsMailConsoleFallback(env)) {
    console.warn("[sendMail] Mail API unreachable after retries — logging email to console (dev fallback)");
    console.log("[sendMail] To:", payload.to);
    console.log("[sendMail] Subject:", payload.subject);
    console.log("[sendMail] Text:\n", payload.text);
    return;
  }

  throw lastError ?? new Error("Mail API unreachable after retries");
}

function formatTopicLabel(topic: string) {
  return contactTopicLabels[topic] ?? topic;
}

function buildEmailFrame(title: string, body: string) {
  return `
    <div style="background:#08101f;padding:24px;font-family:Inter,Segoe UI,sans-serif;color:#f7fbff">
      <div style="max-width:640px;margin:0 auto;background:#101c33;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#7ef2ff">OMDALA</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15">${escapeHtml(title)}</h1>
        <div style="color:#dde8f5;line-height:1.7;font-size:15px">${body}</div>
      </div>
    </div>
  `;
}

function buildContactInternalEmail(
  payload: Required<Omit<ContactRequest, "source">> & { source: string },
) {
  const topicLabel = formatTopicLabel(payload.topic);
  return {
    from: `OMDALA Contact <${OMDALA_INBOXES.hello}>`,
    to: OMDALA_INBOXES.hello,
    reply_to: payload.email,
    subject: `[OMDALA Contact] ${payload.name} · ${topicLabel}`,
    html: buildEmailFrame(
      "New contact intake / Liên hệ mới",
      `
        <p><strong>Tên / Name:</strong> ${escapeHtml(payload.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p><strong>Tổ chức / Organization:</strong> ${escapeHtml(payload.organization || "N/A")}</p>
        <p><strong>Chủ đề / Topic:</strong> ${escapeHtml(topicLabel)}</p>
        <p><strong>Nguồn / Source:</strong> ${escapeHtml(payload.source)}</p>
        <p><strong>Nội dung / Message:</strong></p>
        <p>${escapeHtml(payload.message).replaceAll("\n", "<br />")}</p>
      `,
    ),
    text: [
      "New contact intake / Liên hệ mới",
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Organization: ${payload.organization || "N/A"}`,
      `Topic: ${topicLabel}`,
      `Source: ${payload.source}`,
      "",
      payload.message,
    ].join("\n"),
  };
}

function buildContactAckEmail(
  payload: Required<Omit<ContactRequest, "source">> & { source: string },
) {
  const topicLabel = formatTopicLabel(payload.topic);
  return {
    from: `OMDALA <${OMDALA_INBOXES.hello}>`,
    to: payload.email,
    reply_to: OMDALA_INBOXES.support,
    subject: "OMDALA received your message / OMDALA đã nhận liên hệ của bạn",
    html: buildEmailFrame(
      "We received your message / Chúng tôi đã nhận tin nhắn của bạn",
      `
        <p>Xin chào ${escapeHtml(payload.name)},</p>
        <p>OMDALA đã nhận nội dung liên hệ của bạn về <strong>${escapeHtml(topicLabel)}</strong>. Chúng tôi sẽ phản hồi từ ${escapeHtml(OMDALA_INBOXES.support)} hoặc ${escapeHtml(OMDALA_INBOXES.hello)} sau khi điều phối nội bộ.</p>
        <p>Hello ${escapeHtml(payload.name)},</p>
        <p>We received your message about <strong>${escapeHtml(topicLabel)}</strong>. We will reply from ${escapeHtml(OMDALA_INBOXES.support)} or ${escapeHtml(OMDALA_INBOXES.hello)} after internal routing.</p>
        <p style="margin-top:18px">Reference / Mã tham chiếu: <strong>${escapeHtml(payload.email)}</strong></p>
      `,
    ),
    text: [
      "We received your message / Chúng tôi đã nhận tin nhắn của bạn",
      `Topic: ${topicLabel}`,
      `Reply from: ${OMDALA_INBOXES.support}`,
    ].join("\n"),
  };
}

function buildMagicLinkEmail(email: string, link: string, redirectTo: string) {
  return {
    from: `OMDALA App <${OMDALA_INBOXES.noreply}>`,
    to: email,
    reply_to: OMDALA_INBOXES.support,
    subject: "Your OMDALA magic link / Liên kết đăng nhập OMDALA",
    html: buildEmailFrame(
      "Magic link sign-in / Đăng nhập bằng magic link",
      `
        <p>Bạn vừa yêu cầu đăng nhập vào OMDALA. Nhấn vào nút bên dưới để vào app.</p>
        <p>You requested access to OMDALA. Use the button below to enter the app.</p>
        <p style="margin:24px 0">
          <a href="${escapeHtml(link)}" style="display:inline-flex;padding:12px 18px;border-radius:999px;background:linear-gradient(135deg,#153a72,#3d8bff);color:#f7fbff;text-decoration:none;font-weight:700">
            Open OMDALA / Mở OMDALA
          </a>
        </p>
        <p>Link này có hiệu lực trong 30 phút và sẽ chuyển bạn tới <strong>${escapeHtml(redirectTo)}</strong>.</p>
        <p>This link stays valid for 30 minutes and will redirect you to <strong>${escapeHtml(redirectTo)}</strong>.</p>
        <p>Nếu bạn không yêu cầu email này, hãy bỏ qua. If you did not request this email, you can ignore it.</p>
      `,
    ),
    text: [
      "Magic link sign-in / Đăng nhập bằng magic link",
      `Open: ${link}`,
      `Redirect: ${redirectTo}`,
      "Valid for 30 minutes / Có hiệu lực trong 30 phút",
    ].join("\n"),
  };
}

function buildAccessRequestInternalEmail(payload: Required<AccessRequest>) {
  return {
    from: `OMDALA Access <${OMDALA_INBOXES.app}>`,
    to: OMDALA_INBOXES.app,
    reply_to: payload.email,
    subject: `[OMDALA Access] ${payload.email} · ${payload.role}`,
    html: buildEmailFrame(
      "New access request / Yêu cầu truy cập mới",
      `
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p><strong>Vai trò / Role:</strong> ${escapeHtml(payload.role)}</p>
        <p><strong>Node / Tổ chức:</strong> ${escapeHtml(payload.nodeName)}</p>
        <p><strong>Ghi chú / Note:</strong></p>
        <p>${escapeHtml(payload.note || "No additional note.").replaceAll("\n", "<br />")}</p>
      `,
    ),
    text: [
      "New access request / Yêu cầu truy cập mới",
      `Email: ${payload.email}`,
      `Role: ${payload.role}`,
      `Node: ${payload.nodeName}`,
      "",
      payload.note || "No additional note.",
    ].join("\n"),
  };
}

function buildAccessRequestAckEmail(payload: Required<AccessRequest>) {
  return {
    from: `OMDALA App <${OMDALA_INBOXES.app}>`,
    to: payload.email,
    reply_to: OMDALA_INBOXES.support,
    subject: "OMDALA access request received / OMDALA đã nhận yêu cầu truy cập",
    html: buildEmailFrame(
      "Access request received / Đã nhận yêu cầu truy cập",
      `
        <p>Chúng tôi đã nhận yêu cầu truy cập OMDALA của bạn với vai trò <strong>${escapeHtml(payload.role)}</strong>.</p>
        <p>We received your OMDALA access request for the <strong>${escapeHtml(payload.role)}</strong> role.</p>
        <p>Node hoặc tổ chức bạn gửi: <strong>${escapeHtml(payload.nodeName)}</strong>.</p>
        <p>The node or organization you submitted: <strong>${escapeHtml(payload.nodeName)}</strong>.</p>
        <p>Đội ngũ sẽ phản hồi từ ${escapeHtml(OMDALA_INBOXES.app)} hoặc ${escapeHtml(OMDALA_INBOXES.support)} sau khi rà soát.</p>
        <p>The team will reply from ${escapeHtml(OMDALA_INBOXES.app)} or ${escapeHtml(OMDALA_INBOXES.support)} after review.</p>
      `,
    ),
    text: [
      "Access request received / Đã nhận yêu cầu truy cập",
      `Role: ${payload.role}`,
      `Node: ${payload.nodeName}`,
      `Reply from: ${OMDALA_INBOXES.app}`,
    ].join("\n"),
  };
}

// CORS — restrict to first-party OMDALA surfaces in production
app.use(
  "/*",
  cors({
    origin: (origin) => resolveAllowedOrigin(origin, ALLOWED_ORIGINS),
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-request-id",
      "x-api-key",
      "x-csrf-token",
      "x-service-token",
      "x-e2e-test-secret",
    ],
    exposeHeaders: ["x-request-id"],
    maxAge: 86400,
    credentials: true,
  }),
);

// Global request-id tracing — applies to all routes
app.use("/*", async (c, next) => {
  const requestId = getOrCreateRequestId(c);
  await next();
  c.header("x-request-id", requestId);
});

app.use("/v2/reality/*", async (c, next) => {
  getOrCreateRequestId(c); // already set by global middleware, just ensure variable is seeded
  await next();
});

// Health
app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "omdala-api",
    env: c.env.ENVIRONMENT,
    environment: c.env.ENVIRONMENT,
    ...releaseIdentity(c.env),
  });
});

app.get("/health/deep", async (c) => {
  const identity = releaseIdentity(c.env);
  const identityBound = Boolean(
    identity.release_sha && identity.deployment_id,
  );
  let database: "ok" | "missing" | "error" = "missing";
  let schema: "ok" | "missing" | "error" = "missing";

  if (hasDatabase(c.env)) {
    try {
      const rows = (await queryRows(
        c.env,
        `SELECT
          to_regclass('omdala.nodes') AS nodes,
          to_regclass('omdala.proofs') AS proofs,
          to_regclass('omdala.account_profiles') AS account_profiles,
          to_regclass('omdala.account_preferences') AS account_preferences,
          (
            SELECT is_nullable = 'NO'
            FROM information_schema.columns
            WHERE table_schema = 'omdala'
              AND table_name = 'nodes'
              AND column_name = 'owner_email'
          ) AS nodes_owner_email_locked,
          (
            SELECT is_nullable = 'NO'
            FROM information_schema.columns
            WHERE table_schema = 'omdala'
              AND table_name = 'proofs'
              AND column_name = 'owner_email'
          ) AS proofs_owner_email_locked`,
      )) as Array<Record<string, unknown>>;
      database = "ok";
      const registry = rows[0];
      schema =
        registry?.nodes &&
        registry.proofs &&
        registry.account_profiles &&
        registry.account_preferences &&
        registry.nodes_owner_email_locked === true &&
        registry.proofs_owner_email_locked === true
          ? "ok"
          : "missing";
    } catch {
      database = "error";
      schema = "error";
    }
  }

  const ready = identityBound && database === "ok" && schema === "ok";
  return c.json(
    {
      ok: ready,
      status: ready ? "ok" : "blocked",
      service: "omdala-api",
      environment: c.env.ENVIRONMENT,
      ...identity,
      checks: {
        identity: identityBound ? "ok" : "missing",
        database,
        schema,
      },
    },
    ready ? 200 : 503,
  );
});

app.use("/v2/reality/*", async (c, next) => {
  if (c.req.path === "/v2/reality/health") {
    await next();
    return;
  }

  if (requiresPersistentRealityStore(c.env)) {
    if (!hasDatabase(c.env)) {
      return jsonError(
        c,
        503,
        "PERSISTENCE_REQUIRED",
        "The persistent reality store is required in this environment.",
      );
    }
    const session = await requireAuthenticatedSession(c);
    if (session instanceof Response) return session;
    c.set("realityOwnerEmail", session.email);
    if (!isReleasedRealityRequest(c.req.method, c.req.path)) {
      return jsonError(
        c,
        501,
        "REALITY_ROUTE_NOT_RELEASED",
        "This reality route is not available in the release runtime.",
      );
    }
  }

  await next();
});

app.get("/v2/reality/health", (c) => {
  const persistent = hasDatabase(c.env);
  if (requiresPersistentRealityStore(c.env) && !persistent) {
    return jsonError(
      c,
      503,
      "PERSISTENCE_REQUIRED",
      "The persistent reality store is required in this environment.",
    );
  }

  return jsonOk(c, {
    status: "ok",
    service: "omdala-api",
    namespace: "v2/reality",
    environment: c.env.ENVIRONMENT,
    persistence: persistent ? "postgres" : "in-memory-seed",
  });
});

app.get("/v2/reality/nodes", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const nodes = await listNodes(c.env, getRealityOwnerEmail(c));
      return jsonOk(c, { nodes, total: nodes.length });
    }

    return jsonOk(c, {
      nodes: realitySeed.nodes,
      total: realitySeed.nodes.length,
    });
  });
});

app.get("/v2/reality/states", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const states = await listStates(c.env);
      return jsonOk(c, { states, total: states.length });
    }

    return jsonOk(c, {
      states: realitySeed.states,
      total: realitySeed.states.length,
    });
  });
});

app.get("/v2/reality/commitments", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const commitments = await listCommitments(c.env);
      return jsonOk(c, { commitments, total: commitments.length });
    }

    return jsonOk(c, {
      commitments: realitySeed.commitments,
      total: realitySeed.commitments.length,
    });
  });
});

app.post("/v2/reality/commitments", async (c) => {
  return withV2Guard(c, async () => {
    const body = await c.req.json<RealityCommitmentRequest>().catch(() => null);
    if (!body) {
      return jsonError(
        c,
        400,
        "INVALID_JSON",
        "Request body must be valid JSON",
      );
    }

    const payload = normalizeRealityCommitment(body);
    const validationError = validateCommitmentPayload(payload);
    if (validationError) {
      return jsonError(c, 422, "INVALID_COMMITMENT", validationError);
    }

    if (hasDatabase(c.env)) {
      const record = await createCommitment(
        c.env,
        toCommitmentDbInput(payload),
      );
      return jsonOk(c, record, 201);
    }

    const now = new Date().toISOString();
    const record: CommitmentRecord = {
      id: `commitment_${Date.now()}`,
      fromNodeId: payload.fromNodeId,
      toNodeId: payload.toNodeId,
      title: payload.title,
      summary: payload.summary,
      status: "draft",
      proofIds: [],
      createdAt: now,
      updatedAt: now,
    };

    if (payload.amount !== undefined) {
      record.amount = payload.amount;
    }

    if (payload.currency !== undefined) {
      record.currency = payload.currency;
    }

    if (payload.dueAt !== undefined) {
      record.dueAt = payload.dueAt;
    }

    realitySeed.commitments.unshift(record);
    return jsonOk(c, record, 201);
  });
});

app.get("/v2/reality/transitions", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const transitions = await listTransitions(c.env);
      return jsonOk(c, { transitions, total: transitions.length });
    }

    return jsonOk(c, {
      transitions: realitySeed.transitions,
      total: realitySeed.transitions.length,
    });
  });
});

app.get("/v2/reality/proofs", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const proofs = await listProofs(c.env, getRealityOwnerEmail(c));
      return jsonOk(c, { proofs, total: proofs.length });
    }

    return jsonOk(c, {
      proofs: realitySeed.proofs,
      total: realitySeed.proofs.length,
    });
  });
});

app.post("/v2/reality/proofs", async (c) => {
  return withV2Guard(c, async () => {
    const body = await c.req.json<RealityProofRequest>().catch(() => null);
    if (!body) {
      return jsonError(
        c,
        400,
        "INVALID_JSON",
        "Request body must be valid JSON",
      );
    }

    const payload = normalizeRealityProof(body);
    const validationError = validateProofPayload(payload);
    if (validationError) {
      return jsonError(c, 422, "INVALID_PROOF", validationError);
    }

    if (hasDatabase(c.env)) {
      const record = await createProof(
        c.env,
        getRealityOwnerEmail(c),
        toProofDbInput(payload),
      );
      return jsonOk(c, record, 201);
    }

    const record: RealityProofRecord = {
      id: `proof_${Date.now()}`,
      type: payload.type!,
      summary: payload.summary,
      verificationStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    if (payload.commitmentId) {
      record.commitmentId = payload.commitmentId;
    }

    if (payload.transitionId) {
      record.transitionId = payload.transitionId;
    }

    realitySeed.proofs.unshift(record);
    if (payload.commitmentId) {
      applySeedTrustDeltaForProofSubmission(payload.commitmentId);
    }
    return jsonOk(c, record, 201);
  });
});

app.get("/v2/reality/trust", async (c) => {
  return withV2Guard(c, async () => {
    if (hasDatabase(c.env)) {
      const trust = await listTrust(c.env, getRealityOwnerEmail(c));
      return jsonOk(c, { trust, total: trust.length });
    }

    return jsonOk(c, {
      trust: realitySeed.trust,
      total: realitySeed.trust.length,
    });
  });
});

app.get("/v2/reality/trust/:nodeId", async (c) => {
  return withV2Guard(c, async () => {
    const nodeId = c.req.param("nodeId");
    if (!nodeId) {
      return jsonError(c, 422, "INVALID_NODE_ID", "nodeId is required");
    }

    if (hasDatabase(c.env)) {
      const record = await getTrustByNodeId(
        c.env,
        getRealityOwnerEmail(c),
        nodeId,
      );

      if (!record) {
        return jsonError(c, 404, "TRUST_NOT_FOUND", "Trust record not found");
      }

      return jsonOk(c, record);
    }

    const record = realitySeed.trust.find((item) => item.nodeId === nodeId);

    if (!record) {
      return jsonError(c, 404, "TRUST_NOT_FOUND", "Trust record not found");
    }

    return jsonOk(c, record);
  });
});

app.get("/v2/reality/scenes", async (c) => {
  return withV2Guard(c, async () => {
    return jsonOk(c, {
      scenes: realitySeed.scenes,
      total: realitySeed.scenes.length,
    });
  });
});

app.post("/v2/reality/scenes/:id/run", async (c) => {
  return withV2Guard(c, async () => {
    const sceneId = c.req.param("id");
    const scene = realitySeed.scenes.find((s) => s.scene_id === sceneId);
    if (!scene) {
      return jsonError(c, 404, "SCENE_NOT_FOUND", "Scene does not exist.");
    }

    const now = new Date().toISOString();
    const runId = `run_scene_${Date.now()}`;
    const proofId = `proof_${Date.now()}`;
    const actorId =
      c.req.header("x-user-id") ?? c.req.header("x-actor-id") ?? "scene_runner";

    const run = {
      run_id: runId,
      source: "scene",
      source_id: scene.scene_id,
      actor_id: actorId,
      status: "succeeded",
      policy_decision: "allow_with_logging",
      proof_id: proofId,
      created_at: now,
    };

    realitySeed.runs.unshift(run);

    return jsonOk(c, {
      run_id: runId,
      scene_id: scene.scene_id,
      status: "succeeded",
      proof: {
        proofId,
        runId,
        actorId,
        policyDecision: "allow_with_logging",
        verifiedAt: now,
      },
    });
  });
});

app.get("/v2/reality/runs", async (c) => {
  return withV2Guard(c, async () => {
    const page = Math.max(1, Number(c.req.query("page") ?? 1));
    const limit = Math.max(
      1,
      Math.min(100, Number(c.req.query("limit") ?? 20)),
    );
    const sorted = [...realitySeed.runs].sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1,
    );
    const start = (page - 1) * limit;
    const paged = sorted.slice(start, start + limit);
    return jsonOk(c, {
      runs: paged,
      meta_pagination: { page, limit, total: sorted.length },
    });
  });
});

app.post("/v1/contact", async (c) => {
  const body = await c.req.json<ContactRequest>().catch(() => null);
  if (!body) {
    return jsonError(
      c,
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const payload = apiContract.normalizeContactRequest(body);
  const clientIp = getClientIp(c);
  if (
    isRateLimited(`contact:ip:${clientIp}`, 10, 15 * 60 * 1000) ||
    isRateLimited(`contact:email:${payload.email}`, 5, 15 * 60 * 1000)
  ) {
    return jsonError(
      c,
      429,
      "rate_limited",
      "Too many contact requests. Please retry later.",
    );
  }

  if (
    !payload.name ||
    !payload.message ||
    !apiContract.isEmail(payload.email)
  ) {
    return jsonError(
      c,
      422,
      "invalid_contact_request",
      "Name, valid email, and message are required.",
    );
  }

  try {
    await Promise.all([
      sendMail(c.env, buildContactInternalEmail(payload)),
      sendMail(c.env, buildContactAckEmail(payload)),
    ]);

    return jsonOk(c, {
      received: true,
      replyFrom: OMDALA_INBOXES.support,
      submittedTo: OMDALA_INBOXES.hello,
    });
  } catch (error) {
    return jsonError(
      c,
      502,
      "mail_delivery_failed",
      error instanceof Error
        ? error.message
        : "Unable to deliver contact email.",
    );
  }
});

app.post("/v1/auth/access-request", async (c) => {
  const body = await c.req.json<AccessRequest>().catch(() => null);
  if (!body) {
    return jsonError(
      c,
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const payload = apiContract.normalizeAccessRequest(body);
  const clientIp = getClientIp(c);
  if (
    isRateLimited(`access:ip:${clientIp}`, 10, 15 * 60 * 1000) ||
    isRateLimited(`access:email:${payload.email}`, 5, 15 * 60 * 1000)
  ) {
    return jsonError(
      c,
      429,
      "rate_limited",
      "Too many access requests. Please retry later.",
    );
  }

  if (
    !apiContract.isEmail(payload.email) ||
    !payload.role ||
    !payload.nodeName
  ) {
    return jsonError(
      c,
      422,
      "invalid_access_request",
      "Email, role, and node name are required.",
    );
  }

  try {
    await Promise.all([
      sendMail(c.env, buildAccessRequestInternalEmail(payload)),
      sendMail(c.env, buildAccessRequestAckEmail(payload)),
    ]);

    return jsonOk(
      c,
      {
        received: true,
        reviewInbox: OMDALA_INBOXES.app,
        supportInbox: OMDALA_INBOXES.support,
      },
      201,
    );
  } catch (error) {
    return jsonError(
      c,
      502,
      "mail_delivery_failed",
      error instanceof Error
        ? error.message
        : "Unable to deliver access request email.",
    );
  }
});

app.post("/v1/_e2e/magic-link", async (c) => {
  if (c.env.ENVIRONMENT !== "staging") {
    return jsonError(c, 404, "not_found", "Not found.");
  }

  const expectedSecret = c.env.E2E_TEST_SECRET?.trim() ?? "";
  if (expectedSecret.length < 32) {
    return jsonError(
      c,
      503,
      "e2e_not_configured",
      "Staging E2E bootstrap is not configured.",
    );
  }

  const providedSecret = c.req.header("x-e2e-test-secret")?.trim() ?? "";
  if (!providedSecret || !(await secureStringEqual(providedSecret, expectedSecret))) {
    return jsonError(c, 401, "invalid_e2e_secret", "Invalid E2E credential.");
  }

  const body = await c.req
    .json<{ email?: string; redirectTo?: string }>()
    .catch(() => null);
  if (!body) {
    return jsonError(c, 400, "invalid_json", "Request body must be valid JSON.");
  }

  const { email, redirectTo } = apiContract.normalizeMagicLinkRequest(body);
  if (!apiContract.isEmail(email)) {
    return jsonError(c, 422, "invalid_email", "A valid email is required.");
  }

  const expiresAt = Date.now() + 10 * 60 * 1000;
  const token = await createMagicLinkToken(c.env, {
    email,
    redirectTo,
    exp: expiresAt,
  });

  return jsonOk(
    c,
    {
      token,
      email,
      redirectTo,
      expiresAt: new Date(expiresAt).toISOString(),
    },
    201,
  );
});

app.post("/v1/auth/magic-link/request", async (c) => {
  const body = await c.req
    .json<{ email?: string; redirectTo?: string }>()
    .catch(() => null);
  if (!body) {
    return jsonError(
      c,
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const { email, redirectTo } = apiContract.normalizeMagicLinkRequest(body);
  const clientIp = getClientIp(c);
  if (
    isRateLimited(`magic-link:ip:${clientIp}`, 20, 15 * 60 * 1000) ||
    isRateLimited(`magic-link:email:${email}`, 5, 15 * 60 * 1000)
  ) {
    return jsonError(
      c,
      429,
      "rate_limited",
      "Too many magic-link requests. Please retry later.",
    );
  }

  if (!apiContract.isEmail(email)) {
    return jsonError(c, 422, "invalid_email", "A valid email is required.");
  }

  try {
    const expiresAt = Date.now() + 30 * 60 * 1000;
    const token = await createMagicLinkToken(c.env, {
      email,
      redirectTo,
      exp: expiresAt,
    });
    const link = `${getAuthBaseUrl(c.env)}/login?token=${encodeURIComponent(token)}&next=${encodeURIComponent(redirectTo)}`;

    await sendMail(c.env, buildMagicLinkEmail(email, link, redirectTo));

    return jsonOk(
      c,
      {
        sent: true,
        expiresAt: new Date(expiresAt).toISOString(),
        replyFrom: OMDALA_INBOXES.support,
      },
      201,
    );
  } catch (error) {
    return jsonError(
      c,
      502,
      "magic_link_failed",
      error instanceof Error ? error.message : "Unable to send magic link.",
    );
  }
});

app.get("/v1/auth/magic-link", async (c) => {
  const token = c.req.query("token") ?? "";
  const requestedPath = c.req.query("next");

  if (!token) {
    return jsonError(c, 400, "missing_token", "Missing magic-link token.");
  }

  try {
    const payload = await verifyMagicLinkToken(c.env, token);
    if (!payload) {
      return jsonError(
        c,
        401,
        "invalid_or_expired_token",
        "Magic link is invalid or has expired.",
      );
    }

    return jsonOk(c, {
      authenticated: true,
      email: payload.email,
      redirectTo: apiContract.normalizePath(requestedPath, payload.redirectTo),
      appBaseUrl: getAppBaseUrl(c.env),
      authBaseUrl: getAuthBaseUrl(c.env),
      webBaseUrl: getWebBaseUrl(c.env),
      apiBaseUrl: OMDALA_API_ORIGIN,
    });
  } catch (error) {
    return jsonError(
      c,
      500,
      "magic_link_verification_failed",
      error instanceof Error ? error.message : "Unable to verify magic link.",
    );
  }
});

app.post("/v1/auth/session/exchange", async (c) => {
  const body = await c.req
    .json<{ token?: string; next?: string }>()
    .catch(() => null);
  if (!body?.token) {
    return jsonError(c, 400, "missing_token", "Missing magic-link token.");
  }

  try {
    const payload = await verifyMagicLinkToken(c.env, body.token);
    if (!payload) {
      return jsonError(
        c,
        401,
        "invalid_or_expired_token",
        "Magic link is invalid or has expired.",
      );
    }

    const now = Date.now();
    const accessExp = now + 60 * 60 * 1000;
    const refreshExp = now + 7 * 24 * 60 * 60 * 1000;

    const [accessToken, refreshToken] = await Promise.all([
      createSessionToken(c.env, {
        email: payload.email,
        type: "access",
        exp: accessExp,
      }),
      createSessionToken(c.env, {
        email: payload.email,
        type: "refresh",
        exp: refreshExp,
      }),
    ]);

    setSessionCookies(c, accessToken, refreshToken);

    return jsonOk(c, {
      authenticated: true,
      email: payload.email,
      redirectTo: apiContract.normalizePath(body.next, payload.redirectTo),
      appBaseUrl: getAppBaseUrl(c.env),
      authBaseUrl: getAuthBaseUrl(c.env),
      webBaseUrl: getWebBaseUrl(c.env),
      apiBaseUrl: OMDALA_API_ORIGIN,
      expiresAt: new Date(accessExp).toISOString(),
    });
  } catch (error) {
    return jsonError(
      c,
      500,
      "session_exchange_failed",
      error instanceof Error ? error.message : "Unable to exchange session.",
    );
  }
});

app.get("/v1/auth/session", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  return jsonOk(c, {
    authenticated: true,
    email: session.email,
    expiresAt: new Date(session.exp).toISOString(),
  });
});

app.get("/v1/account/profile", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  try {
    return jsonOk(c, await getRuntimeAccountProfile(c.env, session.email));
  } catch (error) {
    return accountDatabaseErrorResponse(c, error, "readAccountProfile");
  }
});

app.put("/v1/account/profile", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  const body = await c.req.json<unknown>().catch(() => null);
  if (body === null) {
    return jsonError(
      c,
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const patch = validateProfilePatch(body);
  if (!patch.ok) {
    return jsonError(c, 422, "invalid_account_profile", patch.message);
  }

  try {
    const current = await getRuntimeAccountProfile(c.env, session.email);
    const updatedBase = {
      ...current,
      displayName: patch.value.displayName ?? current.displayName,
      timezone: patch.value.timezone ?? current.timezone,
      locale: patch.value.locale ?? current.locale,
      email: current.email,
      id: current.id,
    };
    const updated: OmAiAccountProfile = {
      ...updatedBase,
      ...((patch.value.avatarUrl ?? current.avatarUrl)
        ? { avatarUrl: patch.value.avatarUrl || current.avatarUrl }
        : {}),
      ...((patch.value.bio ?? current.bio)
        ? { bio: patch.value.bio || current.bio }
        : {}),
    };
    if (patch.value.avatarUrl === "") delete updated.avatarUrl;
    if (patch.value.bio === "") delete updated.bio;

    if (!isDatabaseConfigured(c.env)) {
      accountProfileStore.set(session.email, updated);
      return jsonOk(c, updated);
    }

    return jsonOk(c, await writeAccountProfile(c.env, updated));
  } catch (error) {
    return accountDatabaseErrorResponse(c, error, "writeAccountProfile");
  }
});

app.get("/v1/account/preferences", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  try {
    return jsonOk(c, await getRuntimeAccountPreferences(c.env, session.email));
  } catch (error) {
    return accountDatabaseErrorResponse(c, error, "readAccountPreferences");
  }
});

app.put("/v1/account/preferences", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  const body = await c.req.json<unknown>().catch(() => null);
  if (body === null) {
    return jsonError(
      c,
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const patch = validatePreferencesPatch(body);
  if (!patch.ok) {
    return jsonError(c, 422, "invalid_account_preferences", patch.message);
  }

  try {
    const current = await getRuntimeAccountPreferences(c.env, session.email);
    const updated: OmAiAccountPreferences = {
      language: patch.value.language ?? current.language,
      theme: patch.value.theme ?? current.theme,
      notifications: {
        email: patch.value.notifications?.email ?? current.notifications.email,
        push: patch.value.notifications?.push ?? current.notifications.push,
      },
    };

    if (!isDatabaseConfigured(c.env)) {
      accountPreferencesStore.set(session.email, updated);
      return jsonOk(c, updated);
    }

    return jsonOk(
      c,
      await writeAccountPreferences(
        c.env,
        session.email,
        getAccountProfileForEmail(session.email),
        updated,
      ),
    );
  } catch (error) {
    return accountDatabaseErrorResponse(c, error, "writeAccountPreferences");
  }
});

app.get("/v1/billing/subscriptions", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  const primary = getBillingSubscriptionForEmail(session.email);
  return jsonOk(c, {
    items: [primary],
    total: 1,
    primary,
  });
});

app.get("/v1/billing/usage", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  return jsonOk(c, {
    ...getBillingUsageForEmail(session.email),
    eventNames: Object.values(OM_AI_USAGE_EVENT_NAMES),
  });
});

app.get("/v1/providers", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  return jsonOk(c, getOmAiProviderRegistryResponse());
});

app.get("/v1/providers/route", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  const appId = c.req.query("app") ?? OM_AI_APP_ID;
  if (appId !== OM_AI_APP_ID) {
    return jsonError(
      c,
      422,
      "unsupported_app",
      `Unsupported app '${appId}'.`,
    );
  }

  const capability = c.req.query("capability");
  const capabilities = Object.values(OM_AI_PROVIDER_CAPABILITIES);
  if (!capability || !capabilities.includes(capability as OmAiProviderCapabilityId)) {
    return jsonError(
      c,
      422,
      "invalid_capability",
      `Capability is required. Allowed values: ${capabilities.join(", ")}.`,
    );
  }

  return jsonOk(c, getOmAiProviderRouteDecision(capability as OmAiProviderCapabilityId));
});

app.get("/v1/providers/observability", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  return jsonOk(c, getOmAiProviderObservability());
});

app.get("/v1/workspaces", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  const workspaces = getWorkspacesForEmail(session.email);
  return jsonOk(c, {
    schemaVersion: "2026-04-10",
    workspaces,
    total: workspaces.length,
  });
});

app.get("/v1/workspaces/:workspaceId", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  const workspace = getWorkspacesForEmail(session.email).find(
    (item) => item.id === c.req.param("workspaceId"),
  );
  if (!workspace) {
    return jsonError(
      c,
      404,
      "workspace_not_found",
      "Workspace was not found in current session scope.",
    );
  }

  return jsonOk(c, {
    schemaVersion: "2026-04-10",
    workspace,
  });
});

app.post("/v1/workspaces", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  const body = await c.req
    .json<{
      name?: string;
      type?: WorkspaceRecord["type"];
      timezone?: string;
      locale?: WorkspaceRecord["locale"];
    }>()
    .catch(() => null);
  if (!body) {
    return jsonError(
      c,
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const name = body.name?.trim();
  if (!name) {
    return jsonError(c, 422, "invalid_workspace_name", "Workspace name is required.");
  }

  const allowedTypes: WorkspaceRecord["type"][] = [
    "family",
    "organization",
    "school",
    "business",
  ];
  if (body.type && !allowedTypes.includes(body.type)) {
    return jsonError(
      c,
      422,
      "invalid_workspace_type",
      `Allowed workspace types: ${allowedTypes.join(", ")}.`,
    );
  }

  const locale =
    body.locale === "en" || body.locale === "vi" ? body.locale : "vi";
  const profile = getAccountProfileForEmail(session.email);
  const now = new Date().toISOString();
  const workspace: WorkspaceRecord = {
    id: generateEntityId("ws"),
    slug: toSlug(name),
    name,
    type: body.type ?? "organization",
    timezone: body.timezone?.trim() || profile.timezone || "Asia/Ho_Chi_Minh",
    locale,
    ownerId: profile.id,
    members: [
      {
        userId: profile.id,
        role: "owner",
        status: "active",
        joinedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const workspaces = getWorkspacesForEmail(session.email);
  workspaces.push(workspace);
  workspaceStore.set(session.email, workspaces);

  return jsonOk(
    c,
    {
      schemaVersion: "2026-04-10",
      workspace,
    },
    201,
  );
});

app.get("/v1/notifications", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  const unreadOnly = c.req.query("unreadOnly") === "true";
  const notifications = getNotificationsForEmail(session.email);
  const items = unreadOnly
    ? notifications.filter((item) => !item.readAt)
    : notifications;

  return jsonOk(c, {
    schemaVersion: "2026-04-10",
    items,
    total: items.length,
    unread: notifications.filter((item) => !item.readAt).length,
  });
});

app.post("/v1/notifications/mark-read/:notificationId", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  const notificationId = c.req.param("notificationId");
  const notifications = getNotificationsForEmail(session.email);
  const found = notifications.find((item) => item.id === notificationId);
  if (!found) {
    return jsonError(c, 404, "notification_not_found", "Notification not found.");
  }

  if (!found.readAt) {
    found.readAt = new Date().toISOString();
  }
  sharedNotificationStore.set(session.email, notifications);

  return jsonOk(c, {
    schemaVersion: "2026-04-10",
    notification: found,
  });
});

app.post("/v1/analytics/track", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  const body = await c.req
    .json<{
      appId?: AnalyticsEventEnvelope["appId"];
      eventName?: string;
      workspaceId?: string;
      sessionId?: string;
      source?: AnalyticsEventEnvelope["source"];
      occurredAt?: string;
      properties?: unknown;
    }>()
    .catch(() => null);
  if (!body) {
    return jsonError(
      c,
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  const eventName = body.eventName?.trim();
  if (!eventName) {
    return jsonError(c, 422, "invalid_event_name", "eventName is required.");
  }

  const allowedApps: AnalyticsEventEnvelope["appId"][] = [
    "om-ai",
    "omniverse",
    "omdala-platform",
  ];
  const appId = body.appId ?? "omdala-platform";
  if (!allowedApps.includes(appId)) {
    return jsonError(
      c,
      422,
      "invalid_app_id",
      `Allowed appId values: ${allowedApps.join(", ")}.`,
    );
  }

  const allowedSources: AnalyticsEventEnvelope["source"][] = [
    "web",
    "app",
    "admin",
    "docs",
    "api",
    "worker",
  ];
  const source = body.source ?? "api";
  if (!allowedSources.includes(source)) {
    return jsonError(
      c,
      422,
      "invalid_source",
      `Allowed source values: ${allowedSources.join(", ")}.`,
    );
  }

  const profile = getAccountProfileForEmail(session.email);
  const event: AnalyticsEventEnvelope = {
    id: generateEntityId("evt"),
    appId,
    eventName,
    userId: profile.id,
    ...(body.workspaceId ? { workspaceId: body.workspaceId } : {}),
    ...(body.sessionId ? { sessionId: body.sessionId } : {}),
    source,
    occurredAt: body.occurredAt?.trim() || new Date().toISOString(),
    properties: isPlainObject(body.properties)
      ? (body.properties as AnalyticsEventEnvelope["properties"])
      : {},
  };

  const events = getAnalyticsEventsForEmail(session.email);
  events.push(event);
  analyticsEventStore.set(session.email, events);

  return jsonOk(
    c,
    {
      envelopeVersion: "2026-04-10",
      accepted: true,
      eventId: event.id,
    },
    201,
  );
});

app.get("/v1/analytics/dashboard", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) {
    return session;
  }

  const appId = c.req.query("app") as AnalyticsEventEnvelope["appId"] | undefined;
  const events = getAnalyticsEventsForEmail(session.email).filter((item) =>
    appId ? item.appId === appId : true,
  );

  const nowMs = Date.now();
  const last24h = events.filter((item) => {
    const occurredAtMs = Date.parse(item.occurredAt);
    return Number.isFinite(occurredAtMs) && nowMs - occurredAtMs <= 24 * 60 * 60 * 1000;
  });

  const byEventName = new Map<string, number>();
  events.forEach((item) => {
    byEventName.set(item.eventName, (byEventName.get(item.eventName) ?? 0) + 1);
  });
  const topEvents = [...byEventName.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([eventName, count]) => ({ eventName, count }));

  return jsonOk(c, {
    schemaVersion: "2026-04-10",
    summary: {
      totalEvents: events.length,
      eventsLast24h: last24h.length,
      uniqueEventNames: byEventName.size,
    },
    topEvents,
  });
});

app.post("/v1/auth/refresh", async (c) => {
  const requestId = getOrCreateRequestId(c);
  const body = await c.req.json<{ refresh_token?: string }>().catch(() => null);
  const cookieRefreshToken = getCookieValue(c, "omdala_refresh_token");
  const refreshTokenInput = body?.refresh_token ?? cookieRefreshToken;

  if (!refreshTokenInput) {
    return jsonError(
      c,
      400,
      "missing_refresh_token",
      "refresh_token is required.",
    );
  }

  if (!c.env.MAGIC_LINK_SECRET) {
    return jsonError(
      c,
      501,
      "not_configured",
      "Session refresh is not configured.",
    );
  }

  try {
    const payload = await verifySessionToken(
      c.env,
      refreshTokenInput,
      "refresh",
    );
    if (!payload) {
      return jsonError(
        c,
        401,
        "invalid_or_expired_token",
        "Refresh token is invalid or has expired.",
      );
    }

    const now = Date.now();
    const accessExp = now + 60 * 60 * 1000; // 1 hour
    const refreshExp = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const [accessToken, refreshToken] = await Promise.all([
      createSessionToken(c.env, {
        email: payload.email,
        type: "access",
        exp: accessExp,
      }),
      createSessionToken(c.env, {
        email: payload.email,
        type: "refresh",
        exp: refreshExp,
      }),
    ]);

    console.log("v2_request", {
      request_id: requestId,
      route: "/v1/auth/refresh",
      method: "POST",
      status: 200,
      email_hash: payload.email.length,
    });

    setSessionCookies(c, accessToken, refreshToken);

    return jsonOk(c, {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(accessExp).toISOString(),
    });
  } catch (error) {
    return jsonError(
      c,
      500,
      "refresh_failed",
      error instanceof Error ? error.message : "Unable to refresh session.",
    );
  }
});

app.post("/v1/auth/logout", async (c) => {
  // Stateless MVP: no server-side revocation store.
  // Client must clear tokens on their side.
  // Always returns 200 so the client can safely proceed with local cleanup.
  const requestId = getOrCreateRequestId(c);
  console.log("v2_request", {
    request_id: requestId,
    route: "/v1/auth/logout",
    method: "POST",
    status: 200,
  });
  clearSessionCookies(c);
  return jsonOk(c, { ok: true });
});

// Robots — API must never be indexed
app.get("/robots.txt", (c) => {
  return c.text("User-agent: *\nDisallow: /");
});

// ── Custom Security API ────────────────────────────────────────────────────

app.get("/v1/security/csrf", async (c) => {
  const secret = c.env.CSRF_SECRET ?? c.env.MAGIC_LINK_SECRET ?? "";
  if (!secret) {
    return jsonError(c, 501, "not_configured", "CSRF secret is not configured.");
  }
  try {
    const pair = await generateCsrfToken(secret);
    return jsonOk(c, { token: pair.token, expiresAt: new Date(pair.expiresAt).toISOString() });
  } catch (error) {
    return jsonError(c, 500, "csrf_generation_failed", error instanceof Error ? error.message : "Unknown error");
  }
});

app.post("/v1/security/api-keys", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) return session;

  const body = await c.req.json<{ name?: string; scopes?: string[]; expiresInDays?: number }>().catch(() => null);
  if (!body?.name) {
    return jsonError(c, 400, "invalid_request", "API key name is required.");
  }

  try {
    const result = await createApiKeyRecord(body.name, body.scopes, body.expiresInDays);
    return jsonOk(c, { keyId: result.record.keyId, rawKey: result.rawKey, scopes: result.record.scopes }, 201);
  } catch (error) {
    return jsonError(c, 500, "api_key_creation_failed", error instanceof Error ? error.message : "Unknown error");
  }
});

app.post("/v1/security/webhooks/verify", async (c) => {
  const body = await c.req.json<{
    payload?: string;
    signature?: string;
    secret?: string;
    algorithm?: "sha256";
  }>().catch(() => null);
  if (!body?.payload || !body.signature || !body.secret) {
    return jsonError(c, 400, "invalid_request", "payload, signature, and secret are required.");
  }

  try {
    const valid = await verifyWebhookSignature(body.payload, body.signature, body.secret, body.algorithm);
    return jsonOk(c, { valid });
  } catch (error) {
    return jsonError(c, 500, "verification_failed", error instanceof Error ? error.message : "Unknown error");
  }
});

app.post("/v1/security/service-token", async (c) => {
  const secret = c.env.SERVICE_TOKEN_SECRET ?? c.env.MAGIC_LINK_SECRET ?? "";
  if (!secret) {
    return jsonError(c, 501, "not_configured", "Service token secret is not configured.");
  }

  const body = await c.req.json<{ serviceId?: string; ttlSeconds?: number }>().catch(() => null);
  if (!body?.serviceId) {
    return jsonError(c, 400, "invalid_request", "serviceId is required.");
  }

  try {
    const token = await createServiceToken(body.serviceId, secret, body.ttlSeconds);
    return jsonOk(c, { token }, 201);
  } catch (error) {
    return jsonError(c, 500, "token_creation_failed", error instanceof Error ? error.message : "Unknown error");
  }
});

app.post("/v1/security/service-token/verify", async (c) => {
  const secret = c.env.SERVICE_TOKEN_SECRET ?? c.env.MAGIC_LINK_SECRET ?? "";
  if (!secret) {
    return jsonError(c, 501, "not_configured", "Service token secret is not configured.");
  }

  const body = await c.req.json<{ token?: string }>().catch(() => null);
  if (!body?.token) {
    return jsonError(c, 400, "invalid_request", "token is required.");
  }

  try {
    const payload = await verifyServiceToken(body.token, secret);
    if (!payload) {
      return jsonError(c, 401, "invalid_token", "Service token is invalid or expired.");
    }
    return jsonOk(c, { valid: true, serviceId: payload.sub, jti: payload.jti });
  } catch (error) {
    return jsonError(c, 500, "verification_failed", error instanceof Error ? error.message : "Unknown error");
  }
});

// ── AI Auto-Connect API ────────────────────────────────────────────────────

app.get("/v1/ai/connectors", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) return session;

  const connectors = discoverConnectors({
    openaiKey: c.env.OPENAI_API_KEY,
    anthropicKey: c.env.ANTHROPIC_API_KEY,
    geminiKey: c.env.GEMINI_API_KEY,
    azureKey: c.env.AZURE_OPENAI_KEY,
    azureEndpoint: c.env.AZURE_OPENAI_ENDPOINT,
    mistralKey: c.env.MISTRAL_API_KEY,
    groqKey: c.env.GROQ_API_KEY,
    cohereKey: c.env.COHERE_API_KEY,
    customEndpoint: c.env.CUSTOM_AI_ENDPOINT,
    customKey: c.env.CUSTOM_AI_KEY,
  });

  return jsonOk(c, {
    providers: connectors.map((c) => c.provider),
    total: connectors.length,
  });
});

app.get("/v1/ai/health", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) return session;

  const connectors = discoverConnectors({
    openaiKey: c.env.OPENAI_API_KEY,
    anthropicKey: c.env.ANTHROPIC_API_KEY,
    geminiKey: c.env.GEMINI_API_KEY,
    azureKey: c.env.AZURE_OPENAI_KEY,
    azureEndpoint: c.env.AZURE_OPENAI_ENDPOINT,
    mistralKey: c.env.MISTRAL_API_KEY,
    groqKey: c.env.GROQ_API_KEY,
    cohereKey: c.env.COHERE_API_KEY,
    customEndpoint: c.env.CUSTOM_AI_ENDPOINT,
    customKey: c.env.CUSTOM_AI_KEY,
  });

  const results = await Promise.all(
    connectors.map(async (config) => {
      try {
        return await checkAiProviderHealth(config);
      } catch (error) {
        return {
          provider: config.provider,
          ok: false,
          latencyMs: 0,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );

  return jsonOk(c, { providers: results, total: results.length });
});

app.post("/v1/ai/complete", async (c) => {
  const session = await requireAuthenticatedSession(c);
  if (session instanceof Response) return session;

  const body = await c.req.json<{
    messages?: Array<{ role: string; content: string }>;
    maxTokens?: number;
    temperature?: number;
  }>().catch(() => null);

  if (!body?.messages?.length) {
    return jsonError(c, 400, "invalid_request", "messages array is required.");
  }

  const connectors = discoverConnectors({
    openaiKey: c.env.OPENAI_API_KEY,
    anthropicKey: c.env.ANTHROPIC_API_KEY,
    geminiKey: c.env.GEMINI_API_KEY,
    azureKey: c.env.AZURE_OPENAI_KEY,
    azureEndpoint: c.env.AZURE_OPENAI_ENDPOINT,
    mistralKey: c.env.MISTRAL_API_KEY,
    groqKey: c.env.GROQ_API_KEY,
    cohereKey: c.env.COHERE_API_KEY,
    customEndpoint: c.env.CUSTOM_AI_ENDPOINT,
    customKey: c.env.CUSTOM_AI_KEY,
  });

  if (!connectors.length) {
    return jsonError(c, 501, "no_providers", "No AI providers are configured.");
  }

  try {
    const result = await aiCompleteWithFallback(connectors, {
      messages: body.messages.map((m) => ({
        role:
          m.role === "system" || m.role === "assistant" || m.role === "user"
            ? m.role
            : "user",
        content: m.content,
      })),
      maxTokens: body.maxTokens,
      temperature: body.temperature,
    });
    return jsonOk(c, result);
  } catch (error) {
    return jsonError(c, 502, "all_providers_failed", error instanceof Error ? error.message : "Unknown error");
  }
});

// ── Google OAuth ─────────────────────────────────────────────────────────────

const GOOGLE_STATE_TTL_S = 10 * 60;

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function b64url(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromb64url(s: string): string {
  return atob(s.replace(/-/g, "+").replace(/_/g, "/"));
}

async function buildGoogleState(secret: string): Promise<string> {
  const payload = b64url(JSON.stringify({ nonce: crypto.randomUUID().replace(/-/g, ""), exp: Math.floor(Date.now() / 1000) + GOOGLE_STATE_TTL_S }));
  const sig = await hmacHex(secret, payload);
  return `${payload}.${sig}`;
}

async function verifyGoogleState(secret: string, token: string): Promise<boolean> {
  const parts = String(token || "").split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const expected = await hmacHex(secret, parts[0]);
  if (expected !== parts[1]) return false;
  try {
    const p = JSON.parse(fromb64url(parts[0])) as { exp?: number };
    return typeof p.exp === "number" && p.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

app.get("/v1/auth/google/start", async (c) => {
  const clientId = (c.env.GOOGLE_CLIENT_ID ?? "").trim();
  const redirectUri = (c.env.GOOGLE_REDIRECT_URI ?? "").trim();
  const stateSecret = (c.env.GOOGLE_OAUTH_STATE_SECRET ?? c.env.MAGIC_LINK_SECRET ?? "").trim();

  if (!clientId || !redirectUri || !stateSecret) {
    return jsonError(c, 501, "oauth_not_configured", "Google OAuth is not configured.");
  }

  const state = await buildGoogleState(stateSecret);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return Response.redirect(url.toString(), 302);
});

app.get("/v1/auth/google/callback", async (c) => {
  const appBase = getAppBaseUrl(c.env);
  const errRedirect = (r: string) => Response.redirect(`${appBase}/login?error=${encodeURIComponent(r)}`, 302);

  const clientId = (c.env.GOOGLE_CLIENT_ID ?? "").trim();
  const clientSecret = (c.env.GOOGLE_CLIENT_SECRET ?? "").trim();
  const redirectUri = (c.env.GOOGLE_REDIRECT_URI ?? "").trim();
  const stateSecret = (c.env.GOOGLE_OAUTH_STATE_SECRET ?? c.env.MAGIC_LINK_SECRET ?? "").trim();

  if (!clientId || !clientSecret || !redirectUri || !stateSecret) return errRedirect("provider_not_configured");

  const code = c.req.query("code") ?? "";
  const state = c.req.query("state") ?? "";
  const providerError = c.req.query("error") ?? "";

  if (providerError) return errRedirect("oauth_provider_error");
  if (!code || !state) return errRedirect("missing_code_or_state");
  if (!await verifyGoogleState(stateSecret, state)) return errRedirect("invalid_oauth_state");

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const tokenData = await tokenRes.json().catch(() => ({})) as Record<string, unknown>;
  if (!tokenRes.ok || !tokenData.access_token) return errRedirect("oauth_exchange_failed");

  // Get user profile
  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json().catch(() => ({})) as Record<string, unknown>;
  if (!profileRes.ok || !profile.email) return errRedirect("oauth_profile_failed");
  if (profile.email_verified === false) return errRedirect("oauth_email_unverified");

  const email = String(profile.email).trim().toLowerCase();

  // Create session tokens (stateless, HMAC-based — same as magic-link flow)
  if (!c.env.MAGIC_LINK_SECRET) return errRedirect("session_secret_missing");
  const now = Date.now();
  const [accessToken, refreshToken] = await Promise.all([
    createSessionToken(c.env, { email, type: "access", exp: now + 60 * 60 * 1000 }),
    createSessionToken(c.env, { email, type: "refresh", exp: now + 7 * 24 * 60 * 60 * 1000 }),
  ]);

  setSessionCookies(c, accessToken, refreshToken);
  return Response.redirect(`${appBase}/`, 302);
});

export default app;
