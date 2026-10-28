import assert from 'node:assert/strict';
import test from 'node:test';
import { emailJob } from '../jobs/email.js';

const staging = {
  NODE_ENV: 'staging',
  EMAIL_API_URL: 'https://staging-mail.example.invalid/api/send',
  EMAIL_API_KEY: 'test-staging-mail-key',
  EMAIL_FROM: 'sender@omdala.com',
  EMAIL_STAGING_SINK_ADDRESS: 'sink@example.invalid',
};

test('staging mail sends only to the configured sink', async () => {
  let calls = 0;
  const result = await emailJob({
    data: { to: ' SINK@example.invalid ', subject: 'Test', text: 'Hello' },
  }, {
    env: staging,
    fetchImpl: async (url, options) => {
      calls += 1;
      assert.equal(url, staging.EMAIL_API_URL);
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers.Authorization, `Bearer ${staging.EMAIL_API_KEY}`);
      assert.deepEqual(JSON.parse(options.body), {
        to: 'sink@example.invalid',
        subject: 'Test',
        text: 'Hello',
        from: 'sender@omdala.com',
      });
      return { ok: true, json: async () => ({ id: 'staging-message-1' }) };
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { success: true, messageId: 'staging-message-1' });
});

test('explicit production mail configuration accepts its intended recipient', async () => {
  let calls = 0;
  const result = await emailJob({ data: { to: 'person@omdala.com', subject: 'Hello' } }, {
    env: { ...staging, NODE_ENV: 'production', EMAIL_STAGING_SINK_ADDRESS: '' },
    fetchImpl: async (_url, options) => {
      calls += 1;
      assert.equal(JSON.parse(options.body).to, 'person@omdala.com');
      return { ok: true, json: async () => ({ id: 'production-message-1' }) };
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { success: true, messageId: 'production-message-1' });
});

test('staging mail rejects off-sink recipients and sender overrides before fetch', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; throw new Error('unexpected fetch'); };
  await assert.rejects(
    emailJob({ data: { to: 'person@omdala.com', subject: 'Test' } }, { env: staging, fetchImpl }),
    /EMAIL_STAGING_RECIPIENT_REJECTED/,
  );
  await assert.rejects(
    emailJob({ data: { to: 'sink@example.invalid', from: 'other@omdala.com' } }, { env: staging, fetchImpl }),
    /EMAIL_SENDER_REJECTED/,
  );
  assert.equal(calls, 0);
});

test('staging mail requires an explicit HTTPS endpoint, credential, sender, and sink', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; throw new Error('unexpected fetch'); };
  for (const [change, code] of [
    [{ NODE_ENV: '' }, 'EMAIL_ENVIRONMENT_INVALID'],
    [{ NODE_ENV: 'development' }, 'EMAIL_ENVIRONMENT_INVALID'],
    [{ EMAIL_API_URL: '' }, 'EMAIL_API_URL_INVALID'],
    [{ EMAIL_API_URL: 'http://staging-mail.example.invalid/api/send' }, 'EMAIL_API_URL_INVALID'],
    [{ EMAIL_API_KEY: '' }, 'EMAIL_API_KEY_MISSING'],
    [{ EMAIL_FROM: '' }, 'EMAIL_FROM_INVALID'],
    [{ EMAIL_STAGING_SINK_ADDRESS: '' }, 'EMAIL_STAGING_SINK_MISSING'],
  ]) {
    await assert.rejects(
      emailJob({ data: { to: 'sink@example.invalid' } }, {
        env: { ...staging, ...change }, fetchImpl,
      }),
      new RegExp(code),
    );
  }
  assert.equal(calls, 0);
});
