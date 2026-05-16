import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from './app.js';

test('live session create -> connect -> end applies free-metering server-side', async () => {
  const app = createApp();

  const created = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: {
      user_id: 'test_user_live_01',
      persona_id: 'teacher_english_01',
      session_type: 'language_call',
      avatar_enabled: false,
    },
  });

  assert.equal(created.statusCode, 200);
  const createdBody = created.json() as {
    data: {
      session_id: string;
      usage: { free_seconds_remaining_today: number };
      provider_routing: { primary: string; fallback: string[]; reason: string };
    };
    error: null;
  };
  assert.equal(createdBody.error, null);
  assert.equal(createdBody.data.usage.free_seconds_remaining_today, 1800);
  assert.equal(createdBody.data.provider_routing.primary, 'openai_realtime');
  assert.deepEqual(createdBody.data.provider_routing.fallback, ['voice_only']);

  const connected = await app.inject({
    method: 'POST',
    url: `/v2/live/sessions/${createdBody.data.session_id}/connect`,
  });
  assert.equal(connected.statusCode, 200);

  const ended = await app.inject({
    method: 'POST',
    url: `/v2/live/sessions/${createdBody.data.session_id}/end`,
    payload: { billable_seconds: 300 },
  });

  assert.equal(ended.statusCode, 200);
  const endedBody = ended.json() as {
    data: { billable_seconds: number; free_seconds_remaining_today: number };
    error: null;
  };
  assert.equal(endedBody.error, null);
  assert.equal(endedBody.data.billable_seconds, 300);
  assert.equal(endedBody.data.free_seconds_remaining_today, 1500);

  const usage = await app.inject({
    method: 'GET',
    url: '/v2/live/usage/today?user_id=test_user_live_01',
  });
  assert.equal(usage.statusCode, 200);

  const usageBody = usage.json() as {
    data: {
      usage: {
        free_seconds_limit: number;
        free_seconds_used: number;
        free_seconds_remaining: number;
      };
    };
    error: null;
  };

  assert.equal(usageBody.error, null);
  assert.equal(usageBody.data.usage.free_seconds_limit, 1800);
  assert.equal(usageBody.data.usage.free_seconds_used, 300);
  assert.equal(usageBody.data.usage.free_seconds_remaining, 1500);

  await app.close();
});

test('live provider routing returns tavus for business avatar sessions', async () => {
  const app = createApp();

  const created = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: {
      user_id: 'test_user_live_provider_business',
      persona_id: 'teacher_english_01',
      session_type: 'language_call',
      avatar_enabled: true,
      plan_context: 'business',
    },
  });

  assert.equal(created.statusCode, 200);
  const createdBody = created.json() as {
    data: {
      provider_routing: { primary: string; fallback: string[]; reason: string };
    };
  };

  assert.equal(createdBody.data.provider_routing.primary, 'tavus');
  assert.deepEqual(createdBody.data.provider_routing.fallback, ['heygen', 'openai_realtime', 'voice_only']);
  assert.equal(createdBody.data.provider_routing.reason, 'business_avatar_priority');

  await app.close();
});

test('live session create respects idempotency key', async () => {
  const app = createApp();

  const first = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    headers: {
      'x-idempotency-key': 'idem-create-key-001',
    },
    payload: {
      user_id: 'test_user_live_idem_create',
      persona_id: 'teacher_english_01',
      session_type: 'language_call',
      avatar_enabled: false,
    },
  });

  const second = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    headers: {
      'x-idempotency-key': 'idem-create-key-001',
    },
    payload: {
      user_id: 'test_user_live_idem_create',
      persona_id: 'teacher_english_01',
      session_type: 'language_call',
      avatar_enabled: false,
    },
  });

  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);

  const firstBody = first.json() as { data: { session_id: string; idempotent_replayed: boolean } };
  const secondBody = second.json() as { data: { session_id: string; idempotent_replayed: boolean } };

  assert.equal(firstBody.data.idempotent_replayed, false);
  assert.equal(secondBody.data.idempotent_replayed, true);
  assert.equal(firstBody.data.session_id, secondBody.data.session_id);

  await app.close();
});

test('live session end respects idempotency key and avoids double-charge', async () => {
  const app = createApp();

  const created = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: {
      user_id: 'test_user_live_idem_end',
      persona_id: 'teacher_english_01',
      session_type: 'language_call',
      avatar_enabled: false,
    },
  });
  const createdBody = created.json() as { data: { session_id: string } };

  const firstEnd = await app.inject({
    method: 'POST',
    url: `/v2/live/sessions/${createdBody.data.session_id}/end`,
    headers: {
      'x-idempotency-key': 'idem-end-key-001',
    },
    payload: { billable_seconds: 180 },
  });

  const secondEnd = await app.inject({
    method: 'POST',
    url: `/v2/live/sessions/${createdBody.data.session_id}/end`,
    headers: {
      'x-idempotency-key': 'idem-end-key-001',
    },
    payload: { billable_seconds: 180 },
  });

  assert.equal(firstEnd.statusCode, 200);
  assert.equal(secondEnd.statusCode, 200);

  const firstEndBody = firstEnd.json() as {
    data: { idempotent_replayed: boolean; free_seconds_remaining_today: number; billable_seconds: number };
  };
  const secondEndBody = secondEnd.json() as {
    data: { idempotent_replayed: boolean; free_seconds_remaining_today: number; billable_seconds: number };
  };

  assert.equal(firstEndBody.data.idempotent_replayed, false);
  assert.equal(secondEndBody.data.idempotent_replayed, true);
  assert.equal(firstEndBody.data.billable_seconds, 180);
  assert.equal(secondEndBody.data.billable_seconds, 180);
  assert.equal(firstEndBody.data.free_seconds_remaining_today, 1620);
  assert.equal(secondEndBody.data.free_seconds_remaining_today, 1620);

  const usage = await app.inject({
    method: 'GET',
    url: '/v2/live/usage/today?user_id=test_user_live_idem_end',
  });
  const usageBody = usage.json() as {
    data: {
      usage: {
        free_seconds_used: number;
      };
    };
  };

  assert.equal(usageBody.data.usage.free_seconds_used, 180);

  await app.close();
});

test('live validation failures return 400', async () => {
  const app = createApp();

  const invalidCreate = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/create',
    payload: {
      user_id: 'test_invalid',
      persona_id: '',
      session_type: '',
    },
  });
  assert.equal(invalidCreate.statusCode, 400);

  const invalidEnd = await app.inject({
    method: 'POST',
    url: '/v2/live/sessions/session_invalid/end',
    payload: {
      billable_seconds: -5,
    },
  });
  assert.equal(invalidEnd.statusCode, 400);

  await app.close();
});

test('live plans upgrade and moderation escalation work', async () => {
  const app = createApp();

  const upgraded = await app.inject({
    method: 'POST',
    url: '/v2/live/plans/upgrade',
    payload: {
      user_id: 'test_user_live_02',
      plan_id: 'personal_pro',
    },
  });

  assert.equal(upgraded.statusCode, 200);
  const upgradedBody = upgraded.json() as { data: { subscription: { plan_id: string } } };
  assert.equal(upgradedBody.data.subscription.plan_id, 'personal_pro');

  const moderation = await app.inject({
    method: 'POST',
    url: '/v2/live/moderation/check',
    payload: {
      text: 'I think about self-harm when I am alone',
    },
  });

  assert.equal(moderation.statusCode, 200);
  const moderationBody = moderation.json() as {
    data: { safe: boolean; requires_escalation: boolean; reason: string };
  };

  assert.equal(moderationBody.data.safe, false);
  assert.equal(moderationBody.data.requires_escalation, true);
  assert.equal(moderationBody.data.reason, 'high_risk_self_harm_signal');

  await app.close();
});
