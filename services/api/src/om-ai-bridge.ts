// PREP_UNDER_ASSUMPTION(AI-01, bridge as drafted)
//
// Om AI session bridge (docs/contracts/OMAI_SESSION_BRIDGE_CONTRACT_DRAFT.md, proposals
// 1, 2, 3 and 5). A bridge credential is NOT a browser session: it is minted from an
// authenticated session, names one audience, a scope list and one owned workspace, is
// short-lived, and has a server-side row so it can be revoked on its own or with its
// parent session. Everything here is behind the release boundary (`bridgeReleased`).
import type { ApiBindings } from "./contracts";
import {
  countLiveBridgeCredentialsForSession,
  getOrCreateAccountId,
  insertBridgeCredential,
  readAccountId,
  readBridgeCredential,
  revokeBridgeCredential,
  revokeBridgeCredentialsForSession,
  type BridgeCredentialRow,
} from "./db/bridge-repository";

export const BRIDGE_AUDIENCE = "om-ai";
export const BRIDGE_TOKEN_PREFIX = "omb1.";
export const BRIDGE_TTL_SECONDS = 15 * 60;
/** Live credentials one parent session may hold at once. */
export const MAX_LIVE_CREDENTIALS_PER_SESSION = 5;
const MAX_TTL_SECONDS = 60 * 60;
const MAX_CLOCK_SKEW_SECONDS = 60;
const SIGNING_CONTEXT = "omdala:om-ai-bridge:v1:";

/** scope -> the only routes it opens (exact method + path, no wildcards except :workspaceId). */
export const BRIDGE_SCOPES = {
  "session:read": [["GET", "/v1/auth/session"]],
  "profile:read": [["GET", "/v1/account/profile"]],
  "preferences:read": [["GET", "/v1/account/preferences"]],
  "workspaces:read": [["GET", "/v1/workspaces"], ["GET", "/v1/workspaces/:workspaceId"]],
} as const satisfies Record<string, ReadonlyArray<readonly [string, string]>>;
export type BridgeScope = keyof typeof BRIDGE_SCOPES;
export const BRIDGE_SELF_REVOKE_ROUTE = ["POST", "/v1/auth/om-ai/bridge-token/revoke"] as const;

export type BridgeClaims = {
  aud: typeof BRIDGE_AUDIENCE;
  scope: BridgeScope[];
  ws: string;
  sub: string;
  iat: number;
  exp: number;
  jti: string;
};

export class BridgeLimitError extends Error {
  constructor() {
    super("BRIDGE_CREDENTIAL_LIMIT");
  }
}

export type BridgeIdentity = BridgeClaims & { email: string; sid: string };

/** Only environments with a disposable or local store; staging and production answer 501. */
export function bridgeReleased(env: ApiBindings): boolean {
  return ["test", "development", "local"].includes(env.ENVIRONMENT ?? "");
}

const memoryStoreApplies = (env: ApiBindings) => env.ENVIRONMENT === "test" || env.ENVIRONMENT === "development";
const memoryRows = new Map<string, BridgeCredentialRow>();

export function isBridgeScope(value: unknown): value is BridgeScope {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(BRIDGE_SCOPES, value);
}

export function isRouteAllowed(scopes: readonly BridgeScope[], method: string, path: string): boolean {
  if (method === BRIDGE_SELF_REVOKE_ROUTE[0] && path === BRIDGE_SELF_REVOKE_ROUTE[1]) return true;
  return scopes.some((scope) =>
    BRIDGE_SCOPES[scope].some(([allowedMethod, pattern]) => {
      if (method !== allowedMethod) return false;
      if (!pattern.includes(":")) return path === pattern;
      const prefix = pattern.slice(0, pattern.indexOf(":"));
      return path.startsWith(prefix) && path.length > prefix.length && !path.slice(prefix.length).includes("/");
    }),
  );
}

const encoder = new TextEncoder();
const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};
const fromBase64Url = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};
const hmacKey = (secret: string) =>
  crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

const memoryAccountIds = new Map<string, string>();
const toSub = (accountId: string) => `acct_${accountId.replace(/-/g, "")}`;

/**
 * The stable `sub` of an account: a random id stored once per account (migration
 * 0007_account_ids), never derived from the email or from a secret. `create: false`
 * reads without writing, for verification.
 */
export async function accountSubFor(env: ApiBindings, email: string, create: boolean): Promise<string | null> {
  if (memoryStoreApplies(env)) {
    let id = memoryAccountIds.get(email);
    if (!id && create) {
      id = crypto.randomUUID();
      memoryAccountIds.set(email, id);
    }
    return id ? toSub(id) : null;
  }
  const id = create ? await getOrCreateAccountId(env, email) : await readAccountId(env, email);
  return id ? toSub(id) : null;
}

async function sign(env: ApiBindings, payloadPart: string): Promise<string> {
  const key = await hmacKey(env.MAGIC_LINK_SECRET ?? "");
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(SIGNING_CONTEXT + payloadPart))));
}

export async function mintBridgeCredential(
  env: ApiBindings,
  input: { email: string; parentSid: string; workspaceId: string; scopes: BridgeScope[]; nowMs?: number },
) {
  if (!env.MAGIC_LINK_SECRET) throw new Error("MAGIC_LINK_SECRET is not configured");
  const iat = Math.floor((input.nowMs ?? Date.now()) / 1000);
  const claims: BridgeClaims = {
    aud: BRIDGE_AUDIENCE,
    scope: [...new Set(input.scopes)].sort(),
    ws: input.workspaceId,
    sub: (await accountSubFor(env, input.email, true))!,
    iat,
    exp: iat + BRIDGE_TTL_SECONDS,
    jti: crypto.randomUUID(),
  };
  if ((await countLiveCredentials(env, input.parentSid, input.nowMs ?? Date.now())) >= MAX_LIVE_CREDENTIALS_PER_SESSION) {
    throw new BridgeLimitError();
  }
  const row = {
    jti: claims.jti,
    parentSid: input.parentSid,
    ownerEmail: input.email,
    workspaceId: claims.ws,
    scopes: claims.scope,
    expiresAt: claims.exp * 1000,
  };
  if (memoryStoreApplies(env)) memoryRows.set(row.jti, { ...row, revoked: false });
  else await insertBridgeCredential(env, row);
  const payloadPart = toBase64Url(encoder.encode(JSON.stringify(claims)));
  return { token: `${BRIDGE_TOKEN_PREFIX}${payloadPart}.${await sign(env, payloadPart)}`, claims };
}

// Soft limit: the count and the insert are separate statements, so a burst of parallel
// mints can overshoot by a few; the per-account mint rate limit bounds that burst.
async function countLiveCredentials(env: ApiBindings, parentSid: string, nowMs: number): Promise<number> {
  if (!memoryStoreApplies(env)) return countLiveBridgeCredentialsForSession(env, parentSid);
  let live = 0;
  for (const row of memoryRows.values()) {
    if (row.parentSid === parentSid && !row.revoked && row.expiresAt > nowMs) live += 1;
  }
  return live;
}

export const BRIDGE_JTI_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const UUID = BRIDGE_JTI_PATTERN;
const ACCOUNT_ID = /^acct_[0-9a-f]{32}$/;

/** Signature and claim shape only (no store). Returns null for anything not exactly a bridge token. */
export async function verifyBridgeClaims(env: ApiBindings, token: string, nowMs = Date.now()): Promise<BridgeClaims | null> {
  try {
    if (!env.MAGIC_LINK_SECRET || !token.startsWith(BRIDGE_TOKEN_PREFIX)) return null;
    const parts = token.slice(BRIDGE_TOKEN_PREFIX.length).split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    const [payloadPart, signaturePart] = parts;
    const key = await hmacKey(env.MAGIC_LINK_SECRET);
    if (!(await crypto.subtle.verify("HMAC", key, fromBase64Url(signaturePart), encoder.encode(SIGNING_CONTEXT + payloadPart)))) return null;
    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadPart))) as Partial<BridgeClaims>;
    const now = Math.floor(nowMs / 1000);
    if (claims.aud !== BRIDGE_AUDIENCE) return null;
    if (!Array.isArray(claims.scope) || claims.scope.length === 0 || !claims.scope.every(isBridgeScope)) return null;
    if (typeof claims.ws !== "string" || claims.ws.length === 0 || claims.ws.length > 128) return null;
    if (typeof claims.sub !== "string" || !ACCOUNT_ID.test(claims.sub)) return null;
    if (typeof claims.jti !== "string" || !UUID.test(claims.jti)) return null;
    // Seconds, integers only: a millisecond value would be a different lifetime by 1000x.
    if (!Number.isInteger(claims.iat) || !Number.isInteger(claims.exp)) return null;
    const { iat, exp } = claims as { iat: number; exp: number };
    if (iat > now + MAX_CLOCK_SKEW_SECONDS || exp <= now || exp <= iat || exp - iat > MAX_TTL_SECONDS) return null;
    return claims as BridgeClaims;
  } catch {
    return null;
  }
}

export type BridgeAuthResult =
  | { ok: true; identity: BridgeIdentity }
  | { ok: false; reason: "invalid" | "revoked" };

/**
 * Full check: claims, then the server-side row (live, same workspace, scopes and account as
 * the token says), then the parent session via `parentActive`. Store errors propagate so
 * the caller can answer 503 rather than treat an outage as a pass.
 */
export async function authenticateBridgeToken(
  env: ApiBindings,
  token: string,
  parentActive: (input: { sid: string; email: string }) => Promise<boolean>,
  nowMs = Date.now(),
): Promise<BridgeAuthResult> {
  const claims = await verifyBridgeClaims(env, token, nowMs);
  if (!claims) return { ok: false, reason: "invalid" };
  const row = memoryStoreApplies(env) ? (memoryRows.get(claims.jti) ?? null) : await readBridgeCredential(env, claims.jti);
  if (!row) return { ok: false, reason: "invalid" };
  if (row.revoked || row.expiresAt <= nowMs) return { ok: false, reason: "revoked" };
  if (
    row.workspaceId !== claims.ws ||
    row.scopes.join(" ") !== [...claims.scope].sort().join(" ") ||
    row.expiresAt !== claims.exp * 1000 ||
    (await accountSubFor(env, row.ownerEmail, false)) !== claims.sub
  ) {
    return { ok: false, reason: "invalid" };
  }
  if (!(await parentActive({ sid: row.parentSid, email: row.ownerEmail }))) return { ok: false, reason: "revoked" };
  return { ok: true, identity: { ...claims, email: row.ownerEmail, sid: row.parentSid } };
}

export async function revokeBridgeToken(env: ApiBindings, jti: string): Promise<boolean> {
  if (memoryStoreApplies(env)) {
    const row = memoryRows.get(jti);
    if (!row || row.revoked) return false;
    row.revoked = true;
    return true;
  }
  return revokeBridgeCredential(env, jti);
}

export async function revokeBridgeTokensForSession(env: ApiBindings, parentSid: string): Promise<number> {
  if (memoryStoreApplies(env)) {
    let count = 0;
    for (const row of memoryRows.values()) {
      if (row.parentSid === parentSid && !row.revoked) {
        row.revoked = true;
        count += 1;
      }
    }
    return count;
  }
  return revokeBridgeCredentialsForSession(env, parentSid);
}
