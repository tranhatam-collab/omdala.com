import type { FastifyInstance } from 'fastify';
import { getProofById } from '../proofStore.js';
import { fail, ok } from '../response.js';

export function registerProofRoutes(app: FastifyInstance) {
  app.get(
    '/v2/reality/proofs/:id',
    {
      schema: {
        tags: ['proofs'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const proof = await getProofById(params.id);
      if (!proof) {
        reply.code(404);
        return fail('not_found');
      }
      return ok({ proof });
    },
  );
}
