import type { FastifyInstance } from 'fastify';
import { getAuthContext } from '../auth.js';
import { requireSensitiveAuth } from '../auth.js';
import { createProof } from '../proofStore.js';
import { persistence } from '../persistence.js';
import { fail, ok } from '../response.js';
import type { SceneRecord } from '../types.js';
import { nowIso, randomId } from '../utils.js';

export function registerScenesRoutes(app: FastifyInstance) {
  app.get(
    '/v2/reality/scenes',
    {
      schema: {
        tags: ['scenes'],
      },
    },
    async () => {
      const scenes = await persistence.listScenes();
      return ok({ scenes });
    },
  );

  app.post(
    '/v2/reality/scenes',
    {
      schema: {
        tags: ['scenes'],
        body: {
          type: 'object',
          properties: {
            display_name: { type: 'string' },
            safety_class: { type: 'string' },
            actions: { type: 'array', items: { type: 'object' } },
          },
          required: ['display_name', 'safety_class', 'actions'],
        },
      },
    },
    async (request) => {
      const body = request.body as {
        display_name: string;
        safety_class: SceneRecord['safety_class'];
        actions: SceneRecord['actions'];
      };

      const scene: SceneRecord = {
        scene_id: randomId('scene'),
        display_name: body.display_name,
        safety_class: body.safety_class,
        actions: body.actions,
        created_at: nowIso(),
      };

      await persistence.putScene(scene);
      return ok({ scene });
    },
  );

  app.post(
    '/v2/reality/scenes/:id/run',
    {
      schema: {
        tags: ['scenes'],
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
      const scene = await persistence.getScene(params.id);
      if (!scene) {
        reply.code(404);
        return fail('not_found', 'Scene does not exist.');
      }

      const runId = randomId('run_scene');
      const auth = getAuthContext(request);
      const actorId = auth?.userId ?? 'scene_runner';
      const proof = await createProof({
        proofId: randomId('proof'),
        runId,
        actorId,
        policyDecision: 'allow_with_logging',
        requestedState: { scene_id: scene.scene_id, actions: scene.actions },
        actualState: { executed_actions: scene.actions.length },
        confidenceScore: 1,
        verifiedAt: nowIso(),
      });

      await persistence.putRun({
        run_id: runId,
        source: 'scene',
        source_id: scene.scene_id,
        actor_id: actorId,
        status: 'succeeded',
        policy_decision: 'allow_with_logging',
        proof_id: proof.proofId,
        created_at: nowIso(),
      });

      return ok({
        run_id: runId,
        scene_id: scene.scene_id,
        status: 'succeeded',
        proof,
      });
    },
  );
}
