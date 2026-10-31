import assert from 'node:assert/strict';
import test from 'node:test';
import { liveStore } from './live/store.js';
import { createOperationalTestApp } from './testSupport.js';

type Envelope = { data: { subscription?: { plan_id: string } } | null; error: { code: string } | null };

async function planOf(userId: string) {
  const app = createOperationalTestApp({ userId, role: 'owner' });
  const res = await app.inject({ method: 'GET', url: '/v2/live/usage/today' });
  await app.close();
  return (res.json() as { data: { usage: { plan_id: string } } }).data.usage.plan_id;
}

// PREP_UNDER_ASSUMPTION(billing authority, server-side only)
test('account holders of every non-admin role get 403 PLAN_CHANGE_REQUIRES_BILLING and keep their plan', async () => {
  for (const role of ['owner', 'family_admin', 'family_member', 'guest', 'operator', 'technician', 'observer'] as const) {
    const userId = `plan_change_${role}`;
    const app = createOperationalTestApp({ userId, role });
    const res = await app.inject({ method: 'POST', url: '/v2/live/plans/upgrade', payload: { plan_id: 'enterprise_custom' } });
    assert.equal(res.statusCode, 403, role);
    const body = res.json() as Envelope;
    assert.equal(body.error?.code, 'PLAN_CHANGE_REQUIRES_BILLING', role);
    assert.equal(body.data, null);
    await app.close();
    assert.equal(await planOf(userId), 'free', role);
  }
});

test('forged plan identity in body or headers does not unlock the route', async () => {
  const app = createOperationalTestApp({ userId: 'plan_change_forger', role: 'owner' });
  const res = await app.inject({
    method: 'POST',
    url: '/v2/live/plans/upgrade',
    headers: { 'x-role': 'facility_admin', authorization: 'Bearer plan_change_forger:facility_admin' },
    payload: { plan_id: 'business', role: 'facility_admin', user_id: 'someone_else' },
  });
  assert.equal(res.statusCode, 403);
  await app.close();
  assert.equal(await planOf('plan_change_forger'), 'free');
  assert.equal(await planOf('someone_else'), 'free');
});

test('verified admin may change plan only while NODE_ENV is test; validation still applies', async () => {
  const app = createOperationalTestApp({ userId: 'plan_change_admin', role: 'facility_admin' });
  const missing = await app.inject({ method: 'POST', url: '/v2/live/plans/upgrade', payload: {} });
  assert.equal(missing.statusCode, 400);

  const ok = await app.inject({ method: 'POST', url: '/v2/live/plans/upgrade', payload: { plan_id: 'business' } });
  assert.equal(ok.statusCode, 200);
  assert.equal((ok.json() as Envelope).data?.subscription?.plan_id, 'business');

  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const prod = await app.inject({ method: 'POST', url: '/v2/live/plans/upgrade', payload: { plan_id: 'personal_pro' } });
    assert.equal(prod.statusCode, 403);
    assert.equal((prod.json() as Envelope).error?.code, 'PLAN_CHANGE_REQUIRES_BILLING');
  } finally {
    process.env.NODE_ENV = previous;
  }
  await app.close();
  assert.equal(await planOf('plan_change_admin'), 'business');
});

test('test-support store path sets a plan under test and is refused outside test', async () => {
  const sub = await liveStore.upgradePlan('plan_change_support', 'personal_pro');
  assert.equal(sub.plan_id, 'personal_pro');
  assert.equal(await planOf('plan_change_support'), 'personal_pro');

  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    await assert.rejects(() => liveStore.upgradePlan('plan_change_support', 'business'), /plan_change_requires_billing_authority/);
  } finally {
    process.env.NODE_ENV = previous;
  }
  assert.equal(await planOf('plan_change_support'), 'personal_pro');
});
