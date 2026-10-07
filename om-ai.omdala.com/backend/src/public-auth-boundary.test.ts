import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createApp } from './app.js';
import { createOperationalTestApp } from './testSupport.js';

test('public server exposes liveness but reports operational readiness unavailable', async () => {
  const app = createApp();

  const health = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(health.statusCode, 200);

  const ready = await app.inject({ method: 'GET', url: '/ready' });
  assert.equal(ready.statusCode, 503);
  assert.equal(
    (ready.json() as { error: { code: string }; meta: { ready: boolean } }).error.code,
    'omdala_identity_authority_unavailable',
  );
  assert.equal((ready.json() as { meta: { ready: boolean } }).meta.ready, false);

  await app.close();
});

test('all direct operational routes reject forged header, bearer, body, and query identity', async () => {
  const app = createApp();
  const probes = [
    { method: 'GET' as const, url: '/v2/live/sessions?user_id=victim' },
    {
      method: 'POST' as const,
      url: '/v2/live/sessions/create',
      payload: { user_id: 'victim', persona_id: 'teacher_english_01', session_type: 'language_call' },
    },
    {
      method: 'POST' as const,
      url: '/v2/reality/transitions/execute',
      payload: { plan_id: 'plan_attacker', actor_id: 'victim' },
    },
    { method: 'GET' as const, url: '/v2/live/personas' },
    { method: 'GET' as const, url: '/v%32/reality/devices' },
    { method: 'GET' as const, url: '/%76%32/reality/memory/profile' },
    {
      method: 'POST' as const,
      url: '/v%32/reality/memory/aliases',
      payload: { term: 'bypass', target_id: 'must_not_persist' },
    },
    {
      method: 'POST' as const,
      url: '/%76%32/reality/memory/preferences',
      payload: { attacker: true },
    },
  ];

  for (const probe of probes) {
    const response = await app.inject({
      ...probe,
      headers: {
        authorization: 'Bearer attacker:owner',
        'x-user-id': 'attacker',
        'x-role': 'owner',
      },
    });

    assert.equal(response.statusCode, 503, `${probe.method} ${probe.url}`);
    const body = response.json() as {
      data: null;
      error: { code: string };
      meta: { authority: string; direct_public_access: boolean };
    };
    assert.equal(body.data, null);
    assert.equal(body.error.code, 'omdala_identity_authority_unavailable');
    assert.equal(body.meta.authority, 'api.omdala.com');
    assert.equal(body.meta.direct_public_access, false);
    assert.match(response.headers['cache-control'] ?? '', /no-store/u);
  }

  await app.close();
});

test('internal harness derives user identity only from its server-bound verified principal', async () => {
  const app = createOperationalTestApp({ userId: 'verified_user_01', role: 'owner' });
  const created = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    headers: {
      authorization: 'Bearer attacker:owner',
      'x-user-id': 'attacker',
      'x-role': 'owner',
    },
    payload: {
      user_id: 'body_attacker',
      persona_id: 'teacher_english_01',
      session_type: 'language_call',
    },
  });
  assert.equal(created.statusCode, 200);
  const sessionId = (created.json() as { data: { session_id: string } }).data.session_id;

  const fetched = await app.inject({ method: 'GET', url: `/v2/live/sessions/${sessionId}` });
  assert.equal(fetched.statusCode, 200);
  assert.equal(
    (fetched.json() as { data: { session: { user_id: string } } }).data.session.user_id,
    'verified_user_01',
  );

  await app.close();

  const otherUserApp = createOperationalTestApp({ userId: 'verified_user_02', role: 'owner' });
  const crossUser = await otherUserApp.inject({ method: 'GET', url: `/v2/live/sessions/${sessionId}` });
  assert.equal(crossUser.statusCode, 404);

  const crossUserList = await otherUserApp.inject({
    method: 'GET',
    url: '/v2/live/sessions?user_id=verified_user_01',
  });
  assert.deepEqual(
    (crossUserList.json() as { data: { items: unknown[] } }).data.items,
    [],
  );

  for (const probe of [
    { method: 'POST' as const, url: `/v2/live/sessions/${sessionId}/connect` },
    {
      method: 'POST' as const,
      url: `/v2/live/sessions/${sessionId}/end`,
      payload: { billable_seconds: 1 },
    },
    {
      method: 'POST' as const,
      url: '/v2/live/realtime/token',
      payload: { session_id: sessionId, user_id: 'verified_user_01' },
    },
  ]) {
    const response = await otherUserApp.inject(probe);
    assert.equal(response.statusCode, 404, `${probe.method} ${probe.url}`);
  }
  await otherUserApp.close();
});

test('internal authorization role and audit actor ignore request payload claims', async () => {
  const app = createOperationalTestApp({ userId: 'verified_observer', role: 'observer' });

  const plan = await app.inject({
    method: 'POST',
    url: '/v2/reality/transitions/plan',
    payload: { role: 'owner', actionClass: 'sensitive' },
  });
  assert.equal(plan.statusCode, 200);
  assert.equal(
    (plan.json() as { data: { policy_decision: string } }).data.policy_decision,
    'confirm_required',
  );

  const approval = await app.inject({
    method: 'POST',
    url: '/v2/reality/approvals/request',
    payload: { run_id: 'run_identity_test', requested_by: 'attacker' },
  });
  assert.equal(approval.statusCode, 200);
  assert.equal(
    (approval.json() as { data: { approval: { requested_by: string } } }).data.approval.requested_by,
    'verified_observer',
  );

  await app.close();
});

test('production auth source has no request-derived identity parser or dev bypass', async () => {
  const [authSource, appSource, liveSource, transitionSource, deviceSource, approvalSource, serverSource, indexSource] =
    await Promise.all([
      readFile(new URL('./auth.ts', import.meta.url), 'utf8'),
      readFile(new URL('./app.ts', import.meta.url), 'utf8'),
      readFile(new URL('./routes/live.ts', import.meta.url), 'utf8'),
      readFile(new URL('./routes/transitions.ts', import.meta.url), 'utf8'),
      readFile(new URL('./routes/devices.ts', import.meta.url), 'utf8'),
      readFile(new URL('./routes/approvals.ts', import.meta.url), 'utf8'),
      readFile(new URL('./server.ts', import.meta.url), 'utf8'),
      readFile(new URL('./index.ts', import.meta.url), 'utf8'),
    ]);

  for (const forbidden of [
    "request.headers.authorization",
    "request.headers['x-user-id']",
    "request.headers['x-role']",
    'DEV_AUTH_BYPASS',
    "token.split(':')",
  ]) {
    assert.equal(authSource.includes(forbidden), false, forbidden);
  }

  assert.equal(/authUserId\s*\?\?\s*bodyUserId/u.test(liveSource), false);
  assert.equal(/body\.user_id|query\.user_id/u.test(liveSource), false);
  assert.equal(/body\.actor_id|body\.role/u.test(transitionSource), false);
  assert.equal(/body\.actor_id|body\.role/u.test(deviceSource), false);
  assert.equal(/body\.requested_by/u.test(approvalSource), false);
  assert.match(appSource, /installDirectPublicBoundary\(app\)/u);
  assert.ok(
    appSource.indexOf('installDirectPublicBoundary(app)') < appSource.indexOf('registerRoutes(app)'),
  );
  assert.match(serverSource, /return createApp\(\)/u);
  assert.match(indexSource, /createApp\(\)/u);
  assert.equal(serverSource.includes('testSupport'), false);
  assert.equal(indexSource.includes('testSupport'), false);
});
