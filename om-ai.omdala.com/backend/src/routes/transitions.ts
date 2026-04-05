import type { FastifyInstance } from 'fastify';
import { requireSensitiveAuth } from '../auth.js';
import { evaluatePolicy } from '../policyEngine.js';
import { createProof } from '../proofStore.js';
import { persistence } from '../persistence.js';
import { fail, ok } from '../response.js';
import { actionClassEnum, policyDecisionEnum, userRoleEnum } from '../schemas.js';
import type { PlanRecord, UserRole } from '../types.js';
import { nowIso, randomId } from '../utils.js';

export function registerTransitionRoutes(app: FastifyInstance) {
  app.post(
    '/v2/reality/transitions/plan',
    {
      schema: {
        tags: ['transitions'],
        body: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: [...userRoleEnum] },
            actionClass: { type: 'string', enum: [...actionClassEnum] },
            businessMode: { type: 'boolean' },
            raw_input: { type: 'string' },
          },
          required: ['role', 'actionClass'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  plan_id: { type: 'string' },
                  policy_decision: { type: 'string', enum: [...policyDecisionEnum] },
                  steps: { type: 'array', items: { type: 'object' } },
                  input_summary: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                },
                required: ['plan_id', 'policy_decision', 'steps', 'input_summary'],
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
      const body = request.body as {
        role?: UserRole;
        actionClass?: 'observe' | 'low' | 'medium' | 'sensitive' | 'high' | 'critical';
        businessMode?: boolean;
        raw_input?: string;
      };

      const decision = evaluatePolicy({
        role: body.role ?? 'observer',
        actionClass: body.actionClass ?? 'observe',
        businessMode: body.businessMode ?? false,
      });

      const plan: PlanRecord = {
        plan_id: randomId('plan'),
        role: body.role ?? 'observer',
        actionClass: body.actionClass ?? 'observe',
        policy_decision: decision,
        steps: [
          {
            step_id: '1',
            executor: 'native_homekit',
            target_id: 'light_child_01',
            action: 'set_level',
            params: { value: 15 },
          },
        ],
        created_at: nowIso(),
      };

      await persistence.putPlan(plan);

      return ok({
        plan_id: plan.plan_id,
        policy_decision: decision,
        steps: plan.steps,
        input_summary: body.raw_input ?? null,
      });
    },
  );

  app.get(
    '/v2/reality/plans/:id',
    {
      schema: {
        tags: ['transitions'],
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
                properties: { plan: { type: 'object' } },
                required: ['plan'],
              },
              error: { type: 'null' },
            },
            required: ['data', 'error'],
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id: string };
      const plan = await persistence.getPlan(params.id);
      if (!plan) {
        reply.code(404);
        return fail('not_found');
      }
      return ok({ plan });
    },
  );

  app.post(
    '/v2/reality/transitions/execute',
    {
      schema: {
        tags: ['transitions'],
        security: [{ BearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            plan_id: { type: 'string' },
            actor_id: { type: 'string' },
          },
          required: ['plan_id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  run_id: { type: 'string' },
                  proof: {
                    type: 'object',
                    properties: {
                      proofId: { type: 'string' },
                      runId: { type: 'string' },
                      actorId: { type: 'string' },
                      policyDecision: { type: 'string' },
                      requestedState: { type: 'object', additionalProperties: true },
                      actualState: { type: 'object', additionalProperties: true },
                      confidenceScore: { type: 'number' },
                      verifiedAt: { type: 'string' },
                    },
                    required: ['proofId', 'runId', 'actorId', 'requestedState', 'actualState', 'confidenceScore', 'verifiedAt'],
                  },
                },
                required: ['run_id', 'proof'],
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

      const body = request.body as { plan_id?: string; actor_id?: string };
      const planId = body.plan_id ?? randomId('run');
      const plan = await persistence.getPlan(planId);
      if (!plan) {
        reply.code(404);
        return fail('not_found', 'Plan does not exist.');
      }

      const runId = randomId('run');
      const actorId = body.actor_id ?? 'user_demo_01';
      const proof = await createProof({
        proofId: randomId('proof'),
        runId,
        actorId,
        policyDecision: plan.policy_decision,
        requestedState: { steps: plan.steps },
        actualState: { executed_steps: plan.steps.length },
        confidenceScore: 1,
        verifiedAt: nowIso(),
      });

      await persistence.putRun({
        run_id: runId,
        source: 'transition',
        source_id: plan.plan_id,
        actor_id: actorId,
        status: 'succeeded',
        policy_decision: plan.policy_decision,
        proof_id: proof.proofId,
        created_at: nowIso(),
      });

      reply.code(200);
      return ok({ run_id: runId, proof });
    },
  );
}
