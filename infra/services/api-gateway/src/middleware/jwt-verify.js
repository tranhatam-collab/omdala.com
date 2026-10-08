// JWT Verification Middleware
// Verifies Keycloak tokens, caches public key in memory.

import { createRemoteJWKSet, jwtVerify } from 'jose';

let jwks = null;

export async function jwtVerifyMiddleware(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(process.env.JWT_PUBLIC_KEY_URL));
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: process.env.JWT_ISSUER || `https://auth.${process.env.INFRA_DOMAIN}/realms/OMDALA`,
      audience: process.env.JWT_AUDIENCE || 'account',
      clockTolerance: 60,
    });

    // Attach user info to request
    request.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.realm_access?.roles || [],
      tenantId: payload.tenant_id || payload.org_id,
    };

  } catch (err) {
    request.log.warn({ err: err.message }, 'JWT verification failed');
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
}
