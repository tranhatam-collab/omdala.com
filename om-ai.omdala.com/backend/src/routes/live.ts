import type { FastifyInstance } from 'fastify';
import { getLiveAiAuthorityDecision } from '../aiAuthority.js';
import { requireSensitiveAuth } from '../auth.js';
import { fail, ok } from '../response.js';
import { liveStore } from '../live/store.js';
import type { CreateLiveSessionInput } from '../live/types.js';

const ALLOWED_CORRECTION_STYLE = new Set([
  'none',
  'gentle',
  'inline',
  'post_turn',
  'end_of_session',
]);

function readIdempotencyKey(request: { headers: Record<string, unknown> }) {
  const raw = request.headers['x-idempotency-key'];
  return typeof raw === 'string' ? raw.trim() : undefined;
}

function isNonEmptyString(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

export function registerLiveRoutes(app: FastifyInstance) {
  app.get('/v2/live/personas', async (request) => {
    const query = request.query as {
      category?: string;
      language?: string;
      safe_for_children?: string;
      supports_avatar?: string;
      supports_voice_only?: string;
    };

    const personas = await liveStore.listPersonas({
      category: query.category,
      language: query.language,
      safe_for_children:
        query.safe_for_children === undefined ? undefined : query.safe_for_children.toLowerCase() === 'true',
      supports_avatar:
        query.supports_avatar === undefined ? undefined : query.supports_avatar.toLowerCase() === 'true',
      supports_voice_only:
        query.supports_voice_only === undefined ? undefined : query.supports_voice_only.toLowerCase() === 'true',
    });

    return ok({ items: personas }, { total: personas.length });
  });

  app.get('/v2/live/personas/:persona_id', async (request, reply) => {
    const params = request.params as { persona_id: string };
    const persona = await liveStore.getPersona(params.persona_id);
    if (!persona) {
      reply.code(404);
      return fail('persona_not_found');
    }

    return ok({
      ...persona,
      supported_modes: ['voice_call', 'lesson_call'],
      curriculum_bindings: ['english_a1_to_c1'],
      safety_profile: persona.safe_for_children ? 'education_safe_default' : 'wellness_safe_default',
      supported_providers: [],
      ai_authority: getLiveAiAuthorityDecision(),
    });
  });

  app.post('/v2/live/personas/:persona_id/favorite', async (request, reply) => {
    const params = request.params as { persona_id: string };
    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;
    const userId = auth.userId;

    const persona = await liveStore.getPersona(params.persona_id);
    if (!persona) {
      reply.code(404);
      return fail('persona_not_found');
    }

    await liveStore.favoritePersona(userId, params.persona_id);
    return ok({ favorited: true, user_id: userId, persona_id: params.persona_id });
  });

  app.post('/v2/live/sessions/create', async (request, reply) => {
    const body = request.body as Omit<CreateLiveSessionInput, 'user_id'>;

    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;

    if (!isNonEmptyString(body?.persona_id, 120) || !isNonEmptyString(body?.session_type, 120)) {
      reply.code(400);
      return fail('validation_error', 'persona_id and session_type are required strings.');
    }

    const userId = auth.userId;

    const persona = await liveStore.getPersona(body.persona_id.trim());
    if (!persona) {
      reply.code(404);
      return fail('persona_not_found');
    }

    const created = await liveStore.createSession(
      {
        ...body,
        user_id: userId,
        persona_id: body.persona_id.trim(),
        session_type: body.session_type.trim(),
      },
      {
        idempotencyKey: readIdempotencyKey(request),
      },
    );

    return ok({
      session_id: created.session.session_id,
      status: created.session.status,
      idempotent_replayed: created.idempotent_replayed,
      execution_ready: false,
      ai_authority: created.session.ai_authority,
      avatar: {
        enabled: created.session.avatar_enabled,
        provider: null,
        mode: 'blocked',
      },
      usage: {
        free_seconds_remaining_today: created.free_seconds_remaining_today,
      },
    });
  });

  app.post('/v2/live/sessions/:id/connect', async (request, reply) => {
    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;

    const params = request.params as { id: string };
    if (!isNonEmptyString(params.id, 160)) {
      reply.code(400);
      return fail('validation_error', 'session id is required.');
    }

    const session = await liveStore.getSession(params.id.trim());
    if (!session || session.user_id !== auth.userId) {
      reply.code(404);
      return fail('session_not_found');
    }

    reply.code(503);
    return fail(
      'ai_authority_unavailable',
      'Realtime execution has no approved OMDALA API/AIAGENT authority contract.',
      { ai_authority: getLiveAiAuthorityDecision() },
    );
  });

  app.post('/v2/live/sessions/:id/end', async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as { billable_seconds?: number };

    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;

    if (!isNonEmptyString(params.id, 160)) {
      reply.code(400);
      return fail('validation_error', 'session id is required.');
    }

    if (body?.billable_seconds !== undefined && (!Number.isFinite(body.billable_seconds) || body.billable_seconds < 0)) {
      reply.code(400);
      return fail('validation_error', 'billable_seconds must be a non-negative number.');
    }

    const ownedSession = await liveStore.getSession(params.id.trim());
    if (!ownedSession || ownedSession.user_id !== auth.userId) {
      reply.code(404);
      return fail('session_not_found');
    }

    const ended = await liveStore.endSession(params.id.trim(), body?.billable_seconds, {
      idempotencyKey: readIdempotencyKey(request),
    });

    if (!ended) {
      reply.code(404);
      return fail('session_not_found');
    }

    return ok({
      session_id: ended.session.session_id,
      idempotent_replayed: ended.idempotent_replayed,
      billable_seconds: ended.session.billable_seconds,
      free_seconds_remaining_today: ended.usage.free_seconds_remaining,
      summary: {
        main_topics: ['introductions', 'daily routine', 'follow-up questions'],
        language_feedback: {
          strengths: ['good fluency', 'clear sentence structure'],
          corrections: ['past tense consistency', 'article usage'],
        },
        next_recommendation: 'lesson_daily_routine_a2_02',
      },
    });
  });

  app.get('/v2/live/sessions/:id', async (request, reply) => {
    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;

    const params = request.params as { id: string };
    const session = await liveStore.getSession(params.id);
    if (!session || session.user_id !== auth.userId) {
      reply.code(404);
      return fail('session_not_found');
    }

    return ok({ session });
  });

  app.get('/v2/live/sessions', async (request, reply) => {
    const query = request.query as { status?: string };
    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;
    const sessions = await liveStore.listSessions({
      user_id: auth.userId,
      status: query.status,
    });

    return ok({ items: sessions }, { total: sessions.length });
  });

  app.post('/v2/live/realtime/token', async (request, reply) => {
    const body = request.body as { session_id?: string };
    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;
    if (!isNonEmptyString(body?.session_id, 160)) {
      reply.code(400);
      return fail('validation_error', 'session_id is required.');
    }
    const sessionId = body.session_id!.trim();

    const userId = auth.userId;

    const session = await liveStore.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      reply.code(404);
      return fail('session_not_found');
    }

    reply.code(503);
    return fail(
      'ai_authority_unavailable',
      'Realtime tokens cannot be issued outside the OMDALA API/AIAGENT authority contract.',
      { ai_authority: getLiveAiAuthorityDecision() },
    );
  });

  app.post('/v2/live/realtime/session/bootstrap', async (request, reply) => {
    const body = request.body as { session_id?: string };
    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;
    if (!isNonEmptyString(body?.session_id, 160)) {
      reply.code(400);
      return fail('validation_error', 'session_id is required.');
    }
    const sessionId = body.session_id!.trim();

    const userId = auth.userId;

    const session = await liveStore.getSession(sessionId);
    if (!session || session.user_id !== userId) {
      reply.code(404);
      return fail('session_not_found');
    }

    reply.code(503);
    return fail(
      'ai_authority_unavailable',
      'Realtime bootstrap is blocked until the OMDALA API exposes an approved AIAGENT contract.',
      { ai_authority: getLiveAiAuthorityDecision() },
    );
  });

  app.get('/v2/live/memory/profile', async (request, reply) => {
    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;
    const profile = await liveStore.getMemoryProfile(auth.userId);
    return ok({ profile });
  });

  app.patch('/v2/live/memory/profile', async (request, reply) => {
    const body = request.body as {
      display_name?: string;
      timezone?: string;
      target_language?: string;
      correction_style?: 'none' | 'gentle' | 'inline' | 'post_turn' | 'end_of_session';
    };

    if (body?.display_name !== undefined && !isNonEmptyString(body.display_name, 120)) {
      reply.code(400);
      return fail('validation_error', 'display_name must be a non-empty string <= 120 chars.');
    }

    if (body?.timezone !== undefined && !isNonEmptyString(body.timezone, 80)) {
      reply.code(400);
      return fail('validation_error', 'timezone must be a non-empty string <= 80 chars.');
    }

    if (body?.correction_style !== undefined && !ALLOWED_CORRECTION_STYLE.has(body.correction_style)) {
      reply.code(400);
      return fail('validation_error', 'correction_style is invalid.');
    }

    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;
    const profile = await liveStore.patchMemoryProfile(auth.userId, {
      display_name: body.display_name,
      timezone: body.timezone,
      target_language: body.target_language,
      correction_style: body.correction_style,
    });
    return ok({ profile });
  });

  app.get('/v2/live/usage/today', async (request, reply) => {
    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;
    const usage = await liveStore.getUsageToday(auth.userId);
    return ok({ usage });
  });

  app.get('/v2/live/plans', async () => {
    const plans = liveStore.listPlans();
    return ok({ plans });
  });

  app.post('/v2/live/plans/upgrade', async (request, reply) => {
    const body = request.body as { plan_id?: string };
    const auth = requireSensitiveAuth(request, reply);
    if (!auth) return;
    if (!isNonEmptyString(body?.plan_id, 40)) {
      reply.code(400);
      return fail('validation_error', 'plan_id is required.');
    }
    const planId = body.plan_id!.trim();

    const subscription = await liveStore.upgradePlan(auth.userId, planId);
    return ok({ subscription });
  });

  app.post('/v2/live/moderation/check', async (request) => {
    const body = request.body as { text?: string };
    const text = (body.text ?? '').toLowerCase();
    const riskPatterns = ['self-harm', 'kill myself', 'suicide', 'hurt myself'];
    const flagged = riskPatterns.some((pattern) => text.includes(pattern));

    return ok({
      safe: !flagged,
      requires_escalation: flagged,
      safety_profile: flagged ? 'wellness_safe_default' : 'education_safe_default',
      reason: flagged ? 'high_risk_self_harm_signal' : 'no_high_risk_signal',
    });
  });

  app.get('/v2/live/avatar/providers', async () =>
    ok({
      providers: [],
      ai_authority: getLiveAiAuthorityDecision(),
    }),
  );
}
