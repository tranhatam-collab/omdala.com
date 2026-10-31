// Consumer side of the PROPOSED OMDALA session bridge (docs/contracts/OMAI_SESSION_BRIDGE_CONTRACT_DRAFT.md,
// section 8 on branch claude/omdala-t2-core). Label: PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL).
// Nothing here is registered on a route: the public boundary stays closed until the API issues
// bridge credentials and an independent reviewer approves the exact SHA.
import type { AuthContext } from '../auth.js';

export const BRIDGE_AUDIENCE = 'om-ai';
export const BRIDGE_MAX_LIFETIME_SECONDS = 3600;
export const BRIDGE_CLOCK_SKEW_SECONDS = 30;

export type BridgeClaims = {
  sub: string;
  aud: string;
  scope: string[];
  ws: string;
  jti: string;
  iat: number;
  exp: number;
};

/** Thrown by a verifier adapter when the credential authority cannot be reached: the caller gets 503, not 401. */
export class BridgeVerifierUnavailable extends Error {
  constructor(message = 'bridge_verifier_unavailable') {
    super(message);
    this.name = 'BridgeVerifierUnavailable';
  }
}

/** Thrown by a verifier adapter when the authority says the credential or its session was revoked. */
export class BridgeTokenRevoked extends Error {
  constructor(message = 'bridge_token_revoked') {
    super(message);
    this.name = 'BridgeTokenRevoked';
  }
}

/** Verifies the signature and returns the raw claims, or null. Supplied by the API-side contract. */
export type BridgeVerifier = (token: string) => Promise<unknown | null>;
/** True when the bridge credential or its parent session is revoked. May throw if the store is down. */
export type RevocationCheck = (claims: BridgeClaims) => Promise<boolean>;

export type BridgeFailureCode =
  | 'unauthenticated'
  | 'invalid_or_expired_token'
  | 'session_revoked'
  | 'session_authority_unavailable'
  | 'forbidden_scope'
  | 'workspace_mismatch'
  | 'account_mismatch'
  | 'route_not_allowed';

export type BridgeDecision =
  | { ok: true; auth: AuthContext; claims: BridgeClaims }
  | { ok: false; status: 401 | 403 | 503; code: BridgeFailureCode };

export type BridgeRequest = {
  method: string;
  path: string;
  authorization?: string;
  /** Workspace the caller says it is acting in, when the request names one. */
  workspaceId?: string;
  /** Account the caller says it is acting for, when the request names one. */
  accountId?: string;
};

export type BridgeDeps = {
  verify: BridgeVerifier;
  isRevoked: RevocationCheck;
  now?: () => number;
};

const SCOPE_READ = 'om_ai.live:read';
const SCOPE_WRITE = 'om_ai.live:write';

/** Exact allowlist of Om AI routes a bridge credential may reach. Everything else is refused. */
const ROUTES: Array<{ method: string; pattern: RegExp; scope: string }> = [
  { method: 'GET', pattern: /^\/v2\/live\/personas(\/[^/]+)?$/u, scope: SCOPE_READ },
  { method: 'GET', pattern: /^\/v2\/live\/sessions(\/[^/]+)?$/u, scope: SCOPE_READ },
  { method: 'GET', pattern: /^\/v2\/live\/(memory\/profile|usage\/today|plans|avatar\/providers)$/u, scope: SCOPE_READ },
  { method: 'POST', pattern: /^\/v2\/live\/personas\/[^/]+\/favorite$/u, scope: SCOPE_WRITE },
  { method: 'POST', pattern: /^\/v2\/live\/sessions\/(create|[^/]+\/(connect|end))$/u, scope: SCOPE_WRITE },
  { method: 'POST', pattern: /^\/v2\/live\/realtime\/(token|session\/bootstrap)$/u, scope: SCOPE_WRITE },
  { method: 'POST', pattern: /^\/v2\/live\/moderation\/check$/u, scope: SCOPE_WRITE },
  { method: 'PATCH', pattern: /^\/v2\/live\/memory\/profile$/u, scope: SCOPE_WRITE },
];

const isNonEmpty = (value: unknown, max = 200): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;

function parseClaims(raw: unknown, nowSeconds: number): BridgeClaims | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const c = raw as Record<string, unknown>;
  if (!isNonEmpty(c.sub) || !isNonEmpty(c.ws) || !isNonEmpty(c.jti)) return null;
  if (c.aud !== BRIDGE_AUDIENCE) return null;
  if (!Array.isArray(c.scope) || c.scope.length === 0 || !c.scope.every((s) => isNonEmpty(s))) return null;
  if (!Number.isInteger(c.iat) || !Number.isInteger(c.exp)) return null;
  const iat = c.iat as number;
  const exp = c.exp as number;
  // Seconds, not milliseconds: a millisecond value is far in the future and is rejected by the cap.
  if (exp <= nowSeconds || exp - iat > BRIDGE_MAX_LIFETIME_SECONDS || exp <= iat) return null;
  if (iat > nowSeconds + BRIDGE_CLOCK_SKEW_SECONDS) return null;
  return { sub: c.sub, aud: c.aud, scope: c.scope as string[], ws: c.ws, jti: c.jti, iat, exp };
}

function bearer(header: string | undefined): string | null {
  const match = /^Bearer ([A-Za-z0-9._~+/=-]{1,4096})$/u.exec(header ?? '');
  return match ? match[1]! : null;
}

export async function authorizeBridgeRequest(request: BridgeRequest, deps: BridgeDeps): Promise<BridgeDecision> {
  const fail = (status: 401 | 403 | 503, code: BridgeFailureCode): BridgeDecision => ({ ok: false, status, code });
  const token = bearer(request.authorization);
  if (!token) return fail(401, 'unauthenticated');

  let verified: unknown;
  try {
    verified = await deps.verify(token);
  } catch (error) {
    if (error instanceof BridgeVerifierUnavailable) return fail(503, 'session_authority_unavailable');
    if (error instanceof BridgeTokenRevoked) return fail(401, 'session_revoked');
    return fail(401, 'invalid_or_expired_token');
  }
  const nowSeconds = Math.floor((deps.now?.() ?? Date.now()) / 1000);
  const claims = parseClaims(verified, nowSeconds);
  if (!claims) return fail(401, 'invalid_or_expired_token');

  try {
    if (await deps.isRevoked(claims)) return fail(401, 'session_revoked');
  } catch {
    return fail(503, 'session_authority_unavailable');
  }

  const path = request.path.split(/[?#]/u, 1)[0] ?? '';
  const route = ROUTES.find((r) => r.method === request.method.toUpperCase() && r.pattern.test(path));
  if (!route) return fail(403, 'route_not_allowed');
  if (!claims.scope.includes(route.scope)) return fail(403, 'forbidden_scope');

  if (request.workspaceId !== undefined && request.workspaceId !== claims.ws) return fail(403, 'workspace_mismatch');
  if (request.accountId !== undefined && request.accountId !== claims.sub) return fail(403, 'account_mismatch');

  // The draft carries no role claim (finding F4), so a bridge credential is always an account
  // holder: it can never become an admin and cannot pass the plan-change admin check.
  return { ok: true, auth: Object.freeze({ userId: claims.sub, role: 'owner' as const }), claims };
}
