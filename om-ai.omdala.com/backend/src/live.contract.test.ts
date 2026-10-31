import assert from 'node:assert/strict';
import test from 'node:test';
import { createOperationalTestApp } from './testSupport.js';

// Contract tests for the implemented /v2/live endpoints: status codes, error codes, required fields.
// Compared against AI_OM_API_CONTRACT_V1.md section 5 and AI_OM_LIVE_API_CONTRACT_V1.md;
// the endpoint-by-endpoint table is in docs/OMAI_API_CONTRACT_MATRIX_2026-10-30.md.

type Body = { data: Record<string, unknown> | null; error: { code: string; reason?: string } | null; meta?: Record<string, unknown> };

const appFor = (userId: string) => createOperationalTestApp({ userId, role: 'owner' });
const body = (response: { json: () => unknown }) => response.json() as Body;

function assertError(response: { statusCode: number; json: () => unknown }, status: number, code: string) {
  assert.equal(response.statusCode, status);
  const parsed = body(response);
  assert.equal(parsed.data, null);
  assert.equal(parsed.error?.code, code);
}

async function createSession(app: ReturnType<typeof appFor>, extra: Record<string, unknown> = {}) {
  const response = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: { persona_id: 'teacher_english_01', session_type: 'language_call', ...extra },
  });
  return { response, id: (body(response).data?.session_id as string | undefined) ?? '' };
}

test('success responses use the { data, error: null } envelope on every implemented read', async () => {
  const app = appFor('contract_envelope_01');
  for (const url of [
    '/v2/live/personas',
    '/v2/live/personas/teacher_english_01',
    '/v2/live/plans',
    '/v2/live/usage/today',
    '/v2/live/memory/profile',
    '/v2/live/sessions',
    '/v2/live/avatar/providers',
  ]) {
    const response = await app.inject({ method: 'GET', url });
    assert.equal(response.statusCode, 200, url);
    const parsed = body(response);
    assert.equal(parsed.error, null, url);
    assert.ok(parsed.data && typeof parsed.data === 'object', url);
  }
  await app.close();
});

test('GET /personas returns items with the documented persona fields and a total', async () => {
  const app = appFor('contract_personas_01');
  const response = await app.inject({ method: 'GET', url: '/v2/live/personas' });
  const parsed = body(response);
  const items = parsed.data?.items as Array<Record<string, unknown>>;
  assert.equal(parsed.meta?.total, items.length);
  for (const persona of items) {
    for (const field of ['persona_id', 'display_name', 'role_type', 'category', 'primary_languages', 'supports_avatar', 'supports_voice_only', 'premium_required', 'safe_for_children']) {
      assert.ok(field in persona, field);
    }
  }
  await app.close();
});

test('GET /personas/:id returns modes and safety profile; unknown persona is 404 persona_not_found', async () => {
  const app = appFor('contract_persona_detail_01');
  const found = body(await app.inject({ method: 'GET', url: '/v2/live/personas/teacher_english_01' }));
  for (const field of ['persona_id', 'supported_modes', 'safety_profile', 'supported_providers', 'ai_authority']) {
    assert.ok(found.data && field in found.data, field);
  }
  assertError(await app.inject({ method: 'GET', url: '/v2/live/personas/none' }), 404, 'persona_not_found');
  await app.close();
});

test('POST /sessions/create: required fields in the response and error codes for bad input', async () => {
  const app = appFor('contract_create_01');
  const { response } = await createSession(app);
  assert.equal(response.statusCode, 200);
  const data = body(response).data!;
  for (const field of ['session_id', 'status', 'idempotent_replayed', 'execution_ready', 'ai_authority', 'avatar', 'usage']) {
    assert.ok(field in data, field);
  }
  assert.equal(data.status, 'blocked');
  assert.equal(data.execution_ready, false);
  assert.deepEqual(Object.keys(data.avatar as object).sort(), ['enabled', 'mode', 'provider']);
  assert.equal((data.usage as { free_seconds_remaining_today: number }).free_seconds_remaining_today, 1800);

  for (const payload of [{}, { persona_id: 'teacher_english_01' }, { session_type: 'language_call' }, { persona_id: 5, session_type: 'x' }, { persona_id: 'x'.repeat(121), session_type: 'x' }]) {
    assertError(await app.inject({ method: 'POST', url: '/v2/live/sessions/create', payload }), 400, 'validation_error');
  }
  assertError(
    await app.inject({ method: 'POST', url: '/v2/live/sessions/create', payload: { persona_id: 'none', session_type: 'language_call' } }),
    404,
    'persona_not_found',
  );
  await app.close();
});

test('GET /sessions/:id and GET /sessions: own sessions only, filter by status, 404 session_not_found', async () => {
  const owner = appFor('contract_sessions_owner');
  const other = appFor('contract_sessions_other');
  const { id } = await createSession(owner);

  const fetched = body(await owner.inject({ method: 'GET', url: `/v2/live/sessions/${id}` }));
  const session = fetched.data?.session as Record<string, unknown>;
  for (const field of ['session_id', 'user_id', 'persona_id', 'session_type', 'status', 'created_at', 'plan_context', 'billable_seconds', 'ai_authority']) {
    assert.ok(field in session, field);
  }

  assertError(await other.inject({ method: 'GET', url: `/v2/live/sessions/${id}` }), 404, 'session_not_found');
  assertError(await owner.inject({ method: 'GET', url: '/v2/live/sessions/missing' }), 404, 'session_not_found');

  const blocked = body(await owner.inject({ method: 'GET', url: '/v2/live/sessions?status=blocked' }));
  assert.equal((blocked.data?.items as unknown[]).length, 1);
  const ended = body(await owner.inject({ method: 'GET', url: '/v2/live/sessions?status=ended' }));
  assert.equal((ended.data?.items as unknown[]).length, 0);
  const otherList = body(await other.inject({ method: 'GET', url: '/v2/live/sessions' }));
  assert.equal((otherList.data?.items as unknown[]).length, 0);
  await owner.close();
  await other.close();
});

test('connect, realtime token and bootstrap: 503 ai_authority_unavailable for own sessions, 404 otherwise, 400 without session_id', async () => {
  const owner = appFor('contract_realtime_owner');
  const other = appFor('contract_realtime_other');
  const { id } = await createSession(owner);

  const connect = await owner.inject({ method: 'POST', url: `/v2/live/sessions/${id}/connect` });
  assertError(connect, 503, 'ai_authority_unavailable');
  assert.equal((body(connect).meta?.ai_authority as { status: string }).status, 'blocked');
  assertError(await other.inject({ method: 'POST', url: `/v2/live/sessions/${id}/connect` }), 404, 'session_not_found');
  assertError(await owner.inject({ method: 'POST', url: '/v2/live/sessions/missing/connect' }), 404, 'session_not_found');

  for (const url of ['/v2/live/realtime/token', '/v2/live/realtime/session/bootstrap']) {
    assertError(await owner.inject({ method: 'POST', url, payload: { session_id: id } }), 503, 'ai_authority_unavailable');
    assertError(await other.inject({ method: 'POST', url, payload: { session_id: id } }), 404, 'session_not_found');
    assertError(await owner.inject({ method: 'POST', url, payload: { session_id: 'missing' } }), 404, 'session_not_found');
    for (const payload of [{}, { session_id: '' }, { session_id: 7 }, { session_id: 'x'.repeat(161) }]) {
      assertError(await owner.inject({ method: 'POST', url, payload }), 400, 'validation_error');
    }
    const parsed = body(await owner.inject({ method: 'POST', url, payload: { session_id: id } }));
    assert.equal(JSON.stringify(parsed).includes('token":"'), false);
  }
  await owner.close();
  await other.close();
});

test('POST /sessions/:id/end: response fields, 404 for foreign or unknown sessions, 400 for bad billable_seconds', async () => {
  const owner = appFor('contract_end_owner');
  const other = appFor('contract_end_other');
  const { id } = await createSession(owner);

  assertError(await other.inject({ method: 'POST', url: `/v2/live/sessions/${id}/end`, payload: {} }), 404, 'session_not_found');
  assertError(await owner.inject({ method: 'POST', url: '/v2/live/sessions/missing/end', payload: {} }), 404, 'session_not_found');
  for (const billable of [-1, 'ten', null]) {
    const response = await owner.inject({ method: 'POST', url: `/v2/live/sessions/${id}/end`, payload: { billable_seconds: billable } });
    assertError(response, 400, 'validation_error');
  }

  const ended = await owner.inject({ method: 'POST', url: `/v2/live/sessions/${id}/end`, payload: {} });
  assert.equal(ended.statusCode, 200);
  const data = body(ended).data!;
  for (const field of ['session_id', 'idempotent_replayed', 'billable_seconds', 'free_seconds_remaining_today', 'summary']) {
    assert.ok(field in data, field);
  }
  await owner.close();
  await other.close();
});

test('GET /plans returns the five plans with entitlement fields; POST /plans/upgrade is closed (403) and validated for admins', async () => {
  const app = appFor('contract_plans_01');
  const plans = body(await app.inject({ method: 'GET', url: '/v2/live/plans' })).data?.plans as Array<Record<string, unknown>>;
  assert.deepEqual(plans.map((plan) => plan.plan_id), ['free', 'personal_pro', 'education_plus', 'business', 'enterprise_custom']);
  for (const plan of plans) {
    for (const field of ['plan_id', 'display_name', 'daily_free_seconds', 'supports_avatar', 'supports_custom_personas']) {
      assert.ok(field in plan, field);
    }
  }
  assertError(await app.inject({ method: 'POST', url: '/v2/live/plans/upgrade', payload: { plan_id: 'business' } }), 403, 'PLAN_CHANGE_REQUIRES_BILLING');
  assertError(await app.inject({ method: 'POST', url: '/v2/live/plans/upgrade', payload: {} }), 403, 'PLAN_CHANGE_REQUIRES_BILLING');
  await app.close();
});

test('GET /usage/today has the documented usage fields', async () => {
  const app = appFor('contract_usage_01');
  const usage = body(await app.inject({ method: 'GET', url: '/v2/live/usage/today' })).data?.usage as Record<string, unknown>;
  for (const field of ['user_id', 'date_key', 'free_seconds_limit', 'free_seconds_used', 'premium_seconds_used', 'free_seconds_remaining', 'plan_id']) {
    assert.ok(field in usage, field);
  }
  assert.match(String(usage.date_key), /^\d{4}-\d{2}-\d{2}$/);
  await app.close();
});

test('POST /personas/:id/favorite returns the favorite and 404 persona_not_found', async () => {
  const app = appFor('contract_favorite_01');
  const ok = body(await app.inject({ method: 'POST', url: '/v2/live/personas/listener_gentle_01/favorite' }));
  assert.deepEqual(ok.data, { favorited: true, user_id: 'contract_favorite_01', persona_id: 'listener_gentle_01' });
  assertError(await app.inject({ method: 'POST', url: '/v2/live/personas/none/favorite' }), 404, 'persona_not_found');
  await app.close();
});

test('unimplemented documented endpoints are not registered (404), so no caller mistakes them for working', async () => {
  const app = appFor('contract_missing_01');
  const missing: Array<[string, string]> = [
    ['POST', '/v2/live/personas/custom'],
    ['GET', '/v2/live/memory/personas/teacher_english_01'],
    ['DELETE', '/v2/live/memory/personas/teacher_english_01'],
    ['GET', '/v2/live/sessions/x/recap'],
    ['GET', '/v2/live/curriculum/paths'],
    ['GET', '/v2/live/lessons/x'],
    ['POST', '/v2/live/lessons/x/start'],
    ['POST', '/v2/live/lessons/x/complete'],
    ['GET', '/v2/live/usage/cycle'],
    ['POST', '/v2/live/moderation/escalate'],
    ['POST', '/v2/live/avatar/session/start'],
    ['POST', '/v2/live/avatar/session/end'],
    ['GET', '/v2/live/provider/routes'],
  ];
  for (const [method, url] of missing) {
    const response = await app.inject({ method: method as 'GET', url });
    assert.equal(response.statusCode, 404, `${method} ${url}`);
  }
  await app.close();
});
