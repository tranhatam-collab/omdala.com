import assert from 'node:assert/strict';
import test from 'node:test';
import { liveStore } from './live/store.js';
import type { LiveSession } from './live/types.js';

// Sessions cannot reach `active` through the API while the AI authority is blocked, so the
// metering split is exercised at the store boundary by activating a created session directly.
async function activeSession(userId: string, ageSeconds: number): Promise<LiveSession> {
  const created = await liveStore.createSession({
    user_id: userId,
    persona_id: 'teacher_english_01',
    session_type: 'language_call',
  });
  const session = created.session;
  session.status = 'active';
  session.connected_at = new Date(Date.now() - ageSeconds * 1000).toISOString();
  return session;
}

test('free plan: billable seconds draw from the free quota first', async () => {
  const session = await activeSession('metering_free_01', 600);
  const ended = await liveStore.endSession(session.session_id, 600);
  assert.ok(ended);
  assert.equal(ended.session.status, 'ended');
  assert.equal(ended.session.billable_seconds, 600);
  assert.equal(ended.session.free_seconds_applied, 600);
  assert.equal(ended.session.premium_seconds_applied, 0);
  assert.equal(ended.usage.free_seconds_used, 600);
  assert.equal(ended.usage.free_seconds_remaining, 1200);
});

test('free plan: usage past the daily limit spills into premium seconds', async () => {
  const first = await activeSession('metering_spill_01', 1200);
  await liveStore.endSession(first.session_id, 1200);
  const second = await activeSession('metering_spill_01', 1200);
  const ended = await liveStore.endSession(second.session_id, 1200);
  assert.ok(ended);
  assert.equal(ended.session.free_seconds_applied, 600);
  assert.equal(ended.session.premium_seconds_applied, 600);
  assert.equal(ended.usage.free_seconds_remaining, 0);
  assert.equal(ended.usage.premium_seconds_used, 600);
});

test('paid plan with no free allowance bills everything as premium', async () => {
  await liveStore.upgradePlan('metering_paid_01', 'personal_pro');
  const session = await activeSession('metering_paid_01', 300);
  const ended = await liveStore.endSession(session.session_id, 300);
  assert.ok(ended);
  assert.equal(ended.session.free_seconds_applied, 0);
  assert.equal(ended.session.premium_seconds_applied, 300);
  assert.equal(ended.usage.free_seconds_limit, 0);
});

test('billable seconds default to elapsed time, floor fractions, and never go negative', async () => {
  const elapsed = await activeSession('metering_default_01', 90);
  const endedElapsed = await liveStore.endSession(elapsed.session_id);
  assert.ok(endedElapsed);
  assert.ok(endedElapsed.session.billable_seconds >= 90 && endedElapsed.session.billable_seconds <= 93);

  const fractional = await activeSession('metering_default_01', 10);
  const endedFraction = await liveStore.endSession(fractional.session_id, 45.9);
  assert.equal(endedFraction?.session.billable_seconds, 45);

  const negative = await activeSession('metering_default_01', 10);
  const endedNegative = await liveStore.endSession(negative.session_id, -30);
  assert.equal(endedNegative?.session.billable_seconds, 0);
});

test('ending twice does not charge twice, with or without an idempotency key', async () => {
  const session = await activeSession('metering_twice_01', 120);
  const first = await liveStore.endSession(session.session_id, 120, { idempotencyKey: 'metering-key-0001' });
  const replay = await liveStore.endSession(session.session_id, 120, { idempotencyKey: 'metering-key-0001' });
  const again = await liveStore.endSession(session.session_id, 120);
  assert.equal(first?.idempotent_replayed, false);
  assert.equal(replay?.idempotent_replayed, true);
  assert.equal(again?.session.status, 'ended');
  const usage = await liveStore.getUsageToday('metering_twice_01');
  assert.equal(usage.free_seconds_used, 120);
});

test('a session that never connected bills zero and unknown sessions return null', async () => {
  const created = await liveStore.createSession({
    user_id: 'metering_blocked_01',
    persona_id: 'teacher_english_01',
    session_type: 'language_call',
  });
  const ended = await liveStore.endSession(created.session.session_id, 900);
  assert.equal(ended?.session.billable_seconds, 0);
  assert.equal(await liveStore.endSession('live_session_missing'), null);
});
