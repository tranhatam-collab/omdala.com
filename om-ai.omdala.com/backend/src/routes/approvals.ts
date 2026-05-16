import type { FastifyInstance } from 'fastify';
import { requireSensitiveAuth } from '../auth.js';
import { persistence } from '../persistence.js';
import { fail, ok } from '../response.js';
import type { ApprovalRecord } from '../types.js';
import { nowIso, randomId } from '../utils.js';

export function registerApprovalsRoutes(app: FastifyInstance) {
  app.post(
    '/v2/reality/approvals/request',
    {
      schema: {
        tags: ['approvals'],
        body: {
          type: 'object',
          properties: {
            run_id: { type: 'string' },
            requested_by: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['run_id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  approval: {
                    type: 'object',
                    properties: {
                      approval_id: { type: 'string' },
                      run_id: { type: 'string' },
                      requested_by: { type: 'string' },
                      status: { type: 'string' },
                      reason: { type: 'string' },
                      updated_at: { type: 'string' },
                    },
                    required: ['approval_id', 'run_id', 'requested_by', 'status', 'updated_at'],
                  },
                },
                required: ['approval'],
              },
              error: { type: 'null' },
            },
            required: ['data', 'error'],
          },
        },
      },
    },
    async (request) => {
      const body = request.body as { run_id: string; requested_by?: string; reason?: string };
      const approval: ApprovalRecord = {
        approval_id: randomId('approval'),
        run_id: body.run_id,
        requested_by: body.requested_by ?? 'user_demo_01',
        status: 'pending',
        reason: body.reason,
        updated_at: nowIso(),
      };
      await persistence.putApproval(approval);
      return ok({ approval });
    },
  );

  app.get(
    '/v2/reality/approvals/:id',
    {
      schema: {
        tags: ['approvals'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const approval = await persistence.getApproval(params.id);
      if (!approval) {
        reply.code(404);
        return fail('not_found');
      }
      return ok({ approval });
    },
  );

  app.post(
    '/v2/reality/approvals/:id/confirm',
    {
      schema: {
        tags: ['approvals'],
        security: [{ BearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      requireSensitiveAuth(request, reply);
      if (reply.sent) return;

      const params = request.params as { id: string };
      const approval = await persistence.getApproval(params.id);
      if (!approval) {
        reply.code(404);
        return fail('not_found');
      }
      approval.status = 'confirmed';
      approval.updated_at = nowIso();
      await persistence.putApproval(approval);
      return ok({ approval });
    },
  );

  app.post(
    '/v2/reality/approvals/:id/reject',
    {
      schema: {
        tags: ['approvals'],
        security: [{ BearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      requireSensitiveAuth(request, reply);
      if (reply.sent) return;

      const params = request.params as { id: string };
      const approval = await persistence.getApproval(params.id);
      if (!approval) {
        reply.code(404);
        return fail('not_found');
      }
      approval.status = 'rejected';
      approval.updated_at = nowIso();
      await persistence.putApproval(approval);
      return ok({ approval });
    },
  );
}
