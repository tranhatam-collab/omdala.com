import type { FastifyInstance, FastifyRequest } from 'fastify';
import { fail } from './response.js';

export const DIRECT_PUBLIC_BOUNDARY_ERROR = 'omdala_identity_authority_unavailable';

function isOperationalPath(url: string | undefined): boolean {
  if (!url) return false;
  const pathname = url.split(/[?#]/u, 1)[0] ?? '';
  return pathname === '/v2' || pathname.startsWith('/v2/');
}

function isOperationalRequest(request: FastifyRequest): boolean {
  // Fastify matches percent-encoded static characters against a decoded route.
  // Check the canonical matched route as well as the raw URL to close that gap.
  return isOperationalPath(request.routeOptions.url) || isOperationalPath(request.url);
}

/**
 * OM-AI has no approved direct identity/session contract. Keep every operational
 * route unavailable at the public server boundary until the canonical OMDALA
 * verifier can bind a trusted principal server-side.
 */
export function installDirectPublicBoundary(app: FastifyInstance): void {
  app.addHook('onRequest', async (request, reply) => {
    if (!isOperationalRequest(request)) return;

    await reply
      .code(503)
      .header('cache-control', 'no-store')
      .send(
        fail(
          DIRECT_PUBLIC_BOUNDARY_ERROR,
          'Direct OM-AI operational routes are disabled; use the canonical OMDALA API session boundary.',
          {
            authority: 'api.omdala.com',
            direct_public_access: false,
          },
        ),
      );
  });
}
