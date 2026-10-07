import type { FastifyInstance } from 'fastify';
import { fail, ok } from '../response.js';

export function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ok({ ok: true }));

  app.get('/ready', async (_request, reply) => {
    reply.code(503).header('cache-control', 'no-store');
    return fail(
      'omdala_identity_authority_unavailable',
      'OM-AI operational routes remain disabled until canonical OMDALA session verification is integrated.',
      { ready: false, service: 'ai-om-backend' },
    );
  });
}
