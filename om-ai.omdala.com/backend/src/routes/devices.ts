import type { FastifyInstance } from 'fastify';
import { requireSensitiveAuth } from '../auth.js';
import { evaluatePolicy } from '../policyEngine.js';
import { persistence } from '../persistence.js';
import { createProof } from '../proofStore.js';
import { fail, ok } from '../response.js';
import { userRoleEnum } from '../schemas.js';
import type { UserRole } from '../types.js';
import { nowIso, randomId } from '../utils.js';

export function registerDevicesRoutes(app: FastifyInstance) {
  app.get(
    '/v2/reality/devices',
    {
      schema: {
        tags: ['devices'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  devices: { type: 'array', items: { type: 'object' } },
                },
                required: ['devices'],
              },
              error: { type: 'null' },
              meta: { type: 'object' },
            },
            required: ['data', 'error'],
          },
        },
      },
    },
    async (request) => {
      const query = request.query as { page?: number; limit?: number };
      const page = Math.max(1, Number(query.page ?? 1));
      const limit = Math.max(1, Math.min(100, Number(query.limit ?? 20)));
      const devices = await persistence.listDevices();
      const start = (page - 1) * limit;
      const paged = devices.slice(start, start + limit);
      return ok({ devices: paged }, { page, limit, total: devices.length });
    },
  );

  app.get(
    '/v2/reality/devices/:id',
    {
      schema: {
        tags: ['devices'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  device: { type: 'object' },
                },
                required: ['device'],
              },
              error: { type: 'null' },
            },
            required: ['data', 'error'],
          },
          404: {
            type: 'object',
            properties: {
              data: { type: 'null' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  reason: { type: 'string' },
                },
                required: ['code'],
              },
            },
            required: ['data', 'error'],
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const device = await persistence.getDevice(params.id);
      if (!device) {
        reply.code(404);
        return fail('unsupported_device');
      }
      return ok({ device });
    },
  );

  app.post(
    '/v2/reality/devices/:id/execute',
    {
      schema: {
        tags: ['devices'],
        security: [{ BearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            actor_id: { type: 'string' },
            role: { type: 'string', enum: [...userRoleEnum] },
          },
          required: ['action'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  run_id: { type: 'string' },
                  device_id: { type: 'string' },
                  action: { type: 'string' },
                  policy_decision: { type: 'string' },
                  status: { type: 'string' },
                },
                required: ['run_id', 'device_id', 'action', 'policy_decision', 'status'],
              },
              error: { type: 'null' },
            },
            required: ['data', 'error'],
          },
        },
      },
    },
    async (request, reply) => {
      requireSensitiveAuth(request, reply);
      if (reply.sent) return;

      const params = request.params as { id: string };
      const body = request.body as { action?: string; actor_id?: string; role?: UserRole };
      const device = await persistence.getDevice(params.id);
      if (!device) {
        reply.code(404);
        return fail('unsupported_device');
      }

      const actionClass =
        device.safety_class === 'critical'
          ? 'critical'
          : device.safety_class === 'high'
            ? 'high'
            : device.safety_class === 'sensitive'
              ? 'sensitive'
              : device.safety_class === 'medium'
                ? 'medium'
                : 'low';

      const policy = evaluatePolicy({
        role: body.role ?? 'observer',
        actionClass,
        businessMode: false,
      });

      if (policy === 'denied') {
        reply.code(403);
        return fail('policy_denied', 'Policy blocked this device action.');
      }

      const actorId = body.actor_id ?? 'user_demo_01';
      const runId = randomId('run');
      const proof = await createProof({
        proofId: randomId('proof'),
        runId,
        actorId,
        policyDecision: policy,
        requestedState: {
          device_id: device.device_id,
          action: body.action ?? 'noop',
        },
        actualState: { status: 'queued' },
        confidenceScore: 1,
        verifiedAt: nowIso(),
      });

      await persistence.putRun({
        run_id: runId,
        source: 'device',
        source_id: device.device_id,
        actor_id: actorId,
        status: 'queued',
        policy_decision: policy,
        proof_id: proof.proofId,
        created_at: nowIso(),
      });

      return ok({
        run_id: runId,
        device_id: device.device_id,
        action: body.action ?? 'noop',
        policy_decision: policy,
        status: 'queued',
      });
    },
  );
}
