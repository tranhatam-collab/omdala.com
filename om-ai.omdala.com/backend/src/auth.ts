import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserRole } from './types.js';

const ROLE_SET: ReadonlySet<UserRole> = new Set([
  'owner',
  'family_admin',
  'family_member',
  'guest',
  'operator',
  'facility_admin',
  'technician',
  'observer',
]);

const VERIFIED_AUTH_CONTEXT = Symbol('omdala.verified-auth-context');

export type AuthContext = Readonly<{
  userId: string;
  role: UserRole;
}>;

type VerifiedRequest = FastifyRequest & {
  [VERIFIED_AUTH_CONTEXT]?: AuthContext;
};

/** Bind identity only after a server-side OMDALA session verifier succeeds. */
export function bindVerifiedAuthContext(request: FastifyRequest, context: AuthContext): void {
  const userId = context.userId.trim();
  if (!userId || !ROLE_SET.has(context.role)) {
    throw new TypeError('Verified OMDALA identity is invalid.');
  }

  Object.defineProperty(request, VERIFIED_AUTH_CONTEXT, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Object.freeze({ userId, role: context.role }),
  });
}

export function getAuthContext(request: FastifyRequest): AuthContext | null {
  return (request as VerifiedRequest)[VERIFIED_AUTH_CONTEXT] ?? null;
}

export function requireSensitiveAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): AuthContext | null {
  const auth = getAuthContext(request);
  if (!auth) {
    reply
      .code(503)
      .header('cache-control', 'no-store')
      .send({
        data: null,
        error: {
          code: 'omdala_identity_authority_unavailable',
          reason: 'Direct OM-AI access is disabled until the canonical OMDALA session verifier is integrated.',
        },
      });
    return null;
  }

  return auth;
}
