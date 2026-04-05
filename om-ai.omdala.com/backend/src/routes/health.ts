import type { FastifyInstance } from 'fastify';
import { ok } from '../response.js';

export function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ok({ ok: true }));

  app.get('/ready', async () =>
    ok({
      ready: true,
      service: 'ai-om-backend',
    }),
  );
}
