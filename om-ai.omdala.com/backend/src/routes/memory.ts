import type { FastifyInstance } from 'fastify';
import { persistence } from '../persistence.js';
import { ok } from '../response.js';
import type { MemoryAlias } from '../types.js';
import { nowIso, randomId } from '../utils.js';

export function registerMemoryRoutes(app: FastifyInstance) {
  app.get(
    '/v2/reality/memory/profile',
    {
      schema: {
        tags: ['memory'],
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
      const aliases = await persistence.listAliases();
      const start = (page - 1) * limit;
      const paged = aliases.slice(start, start + limit);
      return ok({ aliases: paged }, { page, limit, total: aliases.length });
    },
  );

  app.post(
    '/v2/reality/memory/aliases',
    {
      schema: {
        tags: ['memory'],
        body: {
          type: 'object',
          properties: {
            term: { type: 'string' },
            target_id: { type: 'string' },
          },
          required: ['term', 'target_id'],
        },
      },
    },
    async (request) => {
      const body = request.body as { term: string; target_id: string };
      const alias: MemoryAlias = {
        alias_id: randomId('alias'),
        term: body.term,
        target_id: body.target_id,
        updated_at: nowIso(),
      };
      await persistence.putAlias(alias);
      return ok({ alias });
    },
  );

  app.post(
    '/v2/reality/memory/preferences',
    {
      schema: {
        tags: ['memory'],
        body: {
          type: 'object',
          additionalProperties: true,
        },
      },
    },
    async (request) => {
      const body = request.body as Record<string, unknown>;
      return {
        data: {
          status: 'stored',
          payload: body,
          updated_at: nowIso(),
        },
        error: null,
      };
    },
  );
}
