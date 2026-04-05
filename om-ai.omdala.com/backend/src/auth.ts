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

export type AuthContext = {
  userId: string;
  role: UserRole;
};

export function getAuthContext(request: FastifyRequest): AuthContext | null {
  const authorization = request.headers.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    const token = authorization.slice('Bearer '.length).trim();
    const [userId, roleRaw] = token.split(':');
    if (userId && roleRaw && ROLE_SET.has(roleRaw as UserRole)) {
      return { userId, role: roleRaw as UserRole };
    }
  }

  if (process.env.AUTH_MODE === 'dev' && process.env.DEV_AUTH_BYPASS === '1') {
    return { userId: 'dev_user', role: 'owner' };
  }

  const userIdHeader = request.headers['x-user-id'];
  const roleHeader = request.headers['x-role'];

  const userId = typeof userIdHeader === 'string' ? userIdHeader.trim() : '';
  const roleRaw = typeof roleHeader === 'string' ? roleHeader.trim() : '';

  if (!userId || !roleRaw) return null;
  if (!ROLE_SET.has(roleRaw as UserRole)) return null;

  return { userId, role: roleRaw as UserRole };
}

export function requireSensitiveAuth(request: FastifyRequest, reply: FastifyReply) {
  const auth = getAuthContext(request);
  if (!auth) {
    reply.code(401).send({
      error: 'unauthorized',
      reason: 'Missing or invalid x-user-id/x-role headers.',
    });
    return;
  }

  (request as FastifyRequest & { auth: AuthContext }).auth = auth;
}
