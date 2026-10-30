import assert from 'node:assert/strict';
import test from 'node:test';
import { assessText } from './live/moderation.js';
import { liveStore } from './live/store.js';
import { createOperationalTestApp } from './testSupport.js';

function appFor(userId: string) {
  return createOperationalTestApp({ userId, role: 'owner' });
}

type Envelope = { data: Record<string, unknown> | null; error: { code: string } | null };

test('moderation flags self-harm signals case-insensitively in English and Vietnamese', () => {
  for (const text of ['I want to KILL MYSELF', 'thinking about Self-Harm', 'Tôi muốn chết', 'nghĩ đến tự tử']) {
    const result = assessText(text);
    assert.equal(result.safe, false, text);
    assert.equal(result.requires_escalation, true, text);
    assert.equal(result.safety_profile, 'wellness_safe_default', text);
  }
});

test('moderation passes ordinary learning text and does not flag near-miss words', async () => {
  for (const text of ['', 'Please teach me past tense', 'We talked about a suitcase and my cousin']) {
    const result = assessText(text);
    assert.equal(result.safe, true, text);
    assert.equal(result.requires_escalation, false, text);
    assert.equal(result.reason, 'no_high_risk_signal', text);
  }
});

test('moderation endpoint rejects missing, non-string, and oversized text instead of throwing', async () => {
  const app = appFor('safety_user_moderation');
  const cases: Array<Record<string, unknown> | undefined> = [
    undefined,
    {},
    { text: 42 },
    { text: ['suicide'] },
    { text: 'a'.repeat(10_001) },
  ];
  for (const payload of cases) {
    const res = await app.inject({ method: 'POST', url: '/v2/live/moderation/check', payload });
    assert.equal(res.statusCode, 400, JSON.stringify(payload)?.slice(0, 40));
    assert.equal((res.json() as Envelope).error?.code, 'validation_error');
  }

  const ok = await app.inject({ method: 'POST', url: '/v2/live/moderation/check', payload: { text: 'hello teacher' } });
  assert.equal(ok.statusCode, 200);
  assert.equal((ok.json() as { data: { safe: boolean } }).data.safe, true);
  await app.close();
});

test('session goal with a self-harm signal is escalated and creates no session', async () => {
  const app = appFor('safety_user_goal');
  const blocked = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: { persona_id: 'teacher_english_01', session_type: 'language_call', goal: 'I want to hurt myself' },
  });
  assert.equal(blocked.statusCode, 422);
  assert.equal((blocked.json() as Envelope).error?.code, 'content_requires_escalation');

  const list = await app.inject({ method: 'GET', url: '/v2/live/sessions' });
  assert.equal((list.json() as { data: { items: unknown[] } }).data.items.length, 0);

  const nonString = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: { persona_id: 'teacher_english_01', session_type: 'language_call', goal: { text: 'x' } },
  });
  assert.equal(nonString.statusCode, 400);
  await app.close();
});

test('child profile cannot start a persona that is not child-safe; adult profile can', async () => {
  const childApp = appFor('safety_child_01');
  await liveStore.setProfileAudience('safety_child_01', 'child');

  const denied = await childApp.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: { persona_id: 'listener_gentle_01', session_type: 'voice_call' },
  });
  assert.equal(denied.statusCode, 403);
  assert.equal((denied.json() as Envelope).error?.code, 'persona_not_child_safe');

  const allowed = await childApp.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: { persona_id: 'teacher_english_01', session_type: 'language_call' },
  });
  assert.equal(allowed.statusCode, 200);

  const adultApp = appFor('safety_adult_01');
  const adult = await adultApp.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: { persona_id: 'listener_gentle_01', session_type: 'voice_call' },
  });
  assert.equal(adult.statusCode, 200);
  await childApp.close();
  await adultApp.close();
});

test('a profile patch cannot clear or set the child audience marker', async () => {
  const app = appFor('safety_child_02');
  await liveStore.setProfileAudience('safety_child_02', 'child');

  const patched = await app.inject({
    method: 'PATCH',
    url: '/v2/live/memory/profile',
    payload: { display_name: 'Kid', audience: 'adult' },
  });
  assert.equal(patched.statusCode, 200);
  const profile = (patched.json() as { data: { profile: { audience?: string; display_name?: string } } }).data.profile;
  assert.equal(profile.audience, 'child');
  assert.equal(profile.display_name, 'Kid');

  const still = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: { persona_id: 'listener_gentle_01', session_type: 'voice_call' },
  });
  assert.equal(still.statusCode, 403);
  await app.close();
});

test('avatar is gated by the stored plan; request plan_context cannot raise it', async () => {
  const app = appFor('safety_plan_01');
  const spoofed = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: {
      persona_id: 'teacher_english_01',
      session_type: 'language_call',
      avatar_enabled: true,
      plan_context: 'enterprise_custom',
    },
  });
  assert.equal(spoofed.statusCode, 403);
  assert.equal((spoofed.json() as Envelope).error?.code, 'plan_upgrade_required');

  const noAvatar = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: { persona_id: 'teacher_english_01', session_type: 'language_call', plan_context: 'enterprise_custom' },
  });
  assert.equal(noAvatar.statusCode, 200);
  const sessionId = (noAvatar.json() as { data: { session_id: string } }).data.session_id;
  const fetched = await app.inject({ method: 'GET', url: `/v2/live/sessions/${sessionId}` });
  assert.equal((fetched.json() as { data: { session: { plan_context: string } } }).data.session.plan_context, 'free');

  await liveStore.upgradePlan('safety_plan_01', 'personal_pro');
  const paid = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: { persona_id: 'teacher_english_01', session_type: 'language_call', avatar_enabled: true },
  });
  assert.equal(paid.statusCode, 200);

  const noAvatarPersona = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: { persona_id: 'listener_gentle_01', session_type: 'voice_call', avatar_enabled: true },
  });
  assert.equal(noAvatarPersona.statusCode, 400);
  await app.close();
});

test('persona list filters, detail, favorite, and unknown persona behave as specified', async () => {
  const app = appFor('safety_persona_01');
  const childSafe = await app.inject({ method: 'GET', url: '/v2/live/personas?safe_for_children=true' });
  const items = (childSafe.json() as { data: { items: Array<{ persona_id: string; safe_for_children: boolean }> } }).data.items;
  assert.ok(items.length >= 2);
  assert.ok(items.every((p) => p.safe_for_children));
  assert.ok(!items.some((p) => p.persona_id === 'listener_gentle_01'));

  const voiceOnlyNoAvatar = await app.inject({ method: 'GET', url: '/v2/live/personas?supports_avatar=false' });
  const noAvatar = (voiceOnlyNoAvatar.json() as { data: { items: Array<{ persona_id: string }> } }).data.items;
  assert.deepEqual(noAvatar.map((p) => p.persona_id), ['listener_gentle_01']);

  const detail = await app.inject({ method: 'GET', url: '/v2/live/personas/listener_gentle_01' });
  assert.equal(detail.statusCode, 200);
  assert.equal((detail.json() as { data: { safety_profile: string } }).data.safety_profile, 'wellness_safe_default');

  const missing = await app.inject({ method: 'GET', url: '/v2/live/personas/nope' });
  assert.equal(missing.statusCode, 404);
  const favMissing = await app.inject({ method: 'POST', url: '/v2/live/personas/nope/favorite' });
  assert.equal(favMissing.statusCode, 404);
  const fav = await app.inject({ method: 'POST', url: '/v2/live/personas/teacher_english_01/favorite' });
  assert.equal(fav.statusCode, 200);
  assert.equal((fav.json() as { data: { user_id: string } }).data.user_id, 'safety_persona_01');
  await app.close();
});

test('memory profile patch validates input, tolerates a missing body, and keeps unpatched fields', async () => {
  const app = appFor('safety_memory_01');
  const first = await app.inject({
    method: 'PATCH',
    url: '/v2/live/memory/profile',
    payload: { display_name: 'Linh', target_language: 'en', correction_style: 'gentle' },
  });
  assert.equal(first.statusCode, 200);

  const onlyTz = await app.inject({
    method: 'PATCH',
    url: '/v2/live/memory/profile',
    payload: { timezone: 'Asia/Ho_Chi_Minh' },
  });
  const profile = (onlyTz.json() as { data: { profile: Record<string, string> } }).data.profile;
  assert.equal(profile.display_name, 'Linh');
  assert.equal(profile.target_language, 'en');
  assert.equal(profile.timezone, 'Asia/Ho_Chi_Minh');

  const empty = await app.inject({ method: 'PATCH', url: '/v2/live/memory/profile' });
  assert.equal(empty.statusCode, 200);

  for (const payload of [
    { display_name: '' },
    { timezone: 'x'.repeat(81) },
    { target_language: 'y'.repeat(41) },
    { target_language: 7 },
    { correction_style: 'shouting' },
  ]) {
    const bad = await app.inject({ method: 'PATCH', url: '/v2/live/memory/profile', payload });
    assert.equal(bad.statusCode, 400, JSON.stringify(payload));
  }
  await app.close();
});

test('usage today reports the free quota and follows the stored plan', async () => {
  const app = appFor('safety_usage_01');
  const free = await app.inject({ method: 'GET', url: '/v2/live/usage/today' });
  const freeUsage = (free.json() as { data: { usage: Record<string, unknown> } }).data.usage;
  assert.equal(freeUsage.plan_id, 'free');
  assert.equal(freeUsage.free_seconds_limit, 1800);
  assert.equal(freeUsage.free_seconds_remaining, 1800);

  await liveStore.upgradePlan('safety_usage_01', 'business');
  const paid = await app.inject({ method: 'GET', url: '/v2/live/usage/today' });
  assert.equal((paid.json() as { data: { usage: { plan_id: string } } }).data.usage.plan_id, 'business');
  await app.close();
});
