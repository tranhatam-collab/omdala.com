import type { FastifyInstance } from 'fastify';
import { persistence } from '../persistence.js';
import { fail, ok } from '../response.js';

export function registerRunsRoutes(app: FastifyInstance) {
  app.get(
    '/v2/reality/runs',
    {
      schema: {
        tags: ['runs'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    async (request) => {
      const query = request.query as { page?: number; limit?: number };
      const page = Math.max(1, Number(query.page ?? 1));
      const limit = Math.max(1, Math.min(100, Number(query.limit ?? 20)));
      const runs = await persistence.listRuns();
      const sorted = [...runs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const start = (page - 1) * limit;
      const paged = sorted.slice(start, start + limit);
      return ok({ runs: paged }, { page, limit, total: sorted.length });
    },
  );

  app.get(
    '/v2/reality/runs/:id',
    {
      schema: {
        tags: ['runs'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const run = await persistence.getRun(params.id);
      if (!run) {
        reply.code(404);
        return fail('not_found');
      }
      return ok({ run });
    },
  );
}
