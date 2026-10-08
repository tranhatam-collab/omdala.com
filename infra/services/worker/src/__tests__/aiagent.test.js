import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import {
  AIAGENT_CONTRACT_VERSION,
  AiagentContractError,
  buildAiagentRequestId,
  callAiagentChat,
  resolveAiagentConfiguration,
} from '../lib/aiagent.js';
import { createWorkerHealthPayload } from '../lib/health.js';

const API_KEY = `sk-aiagent-${'a'.repeat(48)}`;
const REQUEST_ID = buildAiagentRequestId('fixture');
const PROVIDER_SHA = 'a'.repeat(40);
const PROVIDER_VERSION_ID = 'provider-version-fixture-1';
const PROVIDER_BUNDLE = 'b'.repeat(64);
const LEDGER_SHA = 'c'.repeat(40);
const LEDGER_VERSION_ID = 'ledger-version-fixture-1';
const LEDGER_BUNDLE = 'd'.repeat(64);
const LEDGER_MIGRATION = 'e'.repeat(64);
const SIGNING_KEY_ID = 'staging-v1';
const signingKeyPair = await webcrypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
const publicKey = Buffer.from(await webcrypto.subtle.exportKey('spki', signingKeyPair.publicKey)).toString('base64url');

const STAGING_ENV = Object.freeze({
  AIAGENT_ENVIRONMENT: 'staging',
  AIAGENT_API_KEY: API_KEY,
  AIAGENT_EXPECTED_PROVIDER_SHA: PROVIDER_SHA,
  AIAGENT_EXPECTED_PROVIDER_VERSION_ID: PROVIDER_VERSION_ID,
  AIAGENT_EXPECTED_PROVIDER_BUNDLE_SHA256: PROVIDER_BUNDLE,
  AIAGENT_EXPECTED_LEDGER_SHA: LEDGER_SHA,
  AIAGENT_EXPECTED_LEDGER_VERSION_ID: LEDGER_VERSION_ID,
  AIAGENT_EXPECTED_LEDGER_BUNDLE_SHA256: LEDGER_BUNDLE,
  AIAGENT_EXPECTED_LEDGER_MIGRATION_SHA256: LEDGER_MIGRATION,
  AIAGENT_RECEIPT_PUBLIC_KEYS: JSON.stringify({ [SIGNING_KEY_ID]: publicKey }),
});

function validData(overrides = {}) {
  return {
    model: 'iai-one/iris-3',
    provider: 'iai-one',
    response: 'verified result',
    request_id: REQUEST_ID,
    tenant_id: 'omdala-com',
    workspace_id: 'omdala-com-staging',
    usage: {
      input_tokens: 10,
      output_tokens: 5,
      total_tokens: 15,
      token_usage_status: 'provider_reported',
    },
    cost_usd: 0.001,
    cost_status: 'authoritative_reconciled',
    cost_ledger_status: 'reconciled',
    ledger_entry_id: 'ledger_fixture_1',
    ledger_release_sha: LEDGER_SHA,
    ledger_deployment_id: LEDGER_VERSION_ID,
    ledger_version_id: LEDGER_VERSION_ID,
    ledger_bundle_sha256: LEDGER_BUNDLE,
    ledger_contract_version: '1.0.0',
    ledger_schema_version: '1',
    ledger_migration_sha256: LEDGER_MIGRATION,
    billing_eligible: true,
    receipt_id: 'prc_fixture_1',
    run_id: 'run_fixture_1',
    finish_reason: 'stop',
    policy_decision: 'allow',
    request_quota: { limit: 100, used: 1, remaining: 99, scope: 'api-key-lifetime' },
    budget: {
      limit_usd: 0.25,
      reserved_usd: 0.001,
      used_usd: 0.001,
      remaining_usd: 0.249,
      reservation_basis: 'configured_rate_conservative_ceiling',
    },
    ...overrides,
  };
}

function contractResponse(data, requestId = REQUEST_ID, status = 200) {
  return new Response(JSON.stringify({
    ok: status >= 200 && status < 300,
    ...(status >= 200 && status < 300 ? { data } : { error: data }),
    contract_version: AIAGENT_CONTRACT_VERSION,
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Trace-ID': requestId,
      'X-Request-ID': requestId,
    },
  });
}

function runFor(data, overrides = {}) {
  return {
    run_id: data.run_id,
    receipt_id: data.receipt_id,
    request_id: data.request_id,
    status: 'success',
    model: data.model,
    tenant_id: data.tenant_id,
    workspace_id: data.workspace_id,
    input_tokens: data.usage.input_tokens,
    output_tokens: data.usage.output_tokens,
    cost_usd: data.cost_usd,
    billing_eligible: true,
    cost_ledger_status: 'reconciled',
    ledger_entry_id: data.ledger_entry_id,
    ...overrides,
  };
}

async function signedReceiptFor(data, overrides = {}, corruptSignature = false) {
  const payload = {
    receipt_id: data.receipt_id,
    receipt_type: 'chat',
    run_id: data.run_id,
    request_id: data.request_id,
    tenant_id: data.tenant_id,
    workspace_id: data.workspace_id,
    model: data.model,
    provider: 'managed-upstream',
    input_tokens: data.usage.input_tokens,
    output_tokens: data.usage.output_tokens,
    cost_usd: data.cost_usd,
    billing_eligible: true,
    cost_ledger_status: 'reconciled',
    ledger_entry_id: data.ledger_entry_id,
    ledger_release_sha: LEDGER_SHA,
    ledger_deployment_id: LEDGER_VERSION_ID,
    ledger_version_id: LEDGER_VERSION_ID,
    ledger_bundle_sha256: LEDGER_BUNDLE,
    ledger_contract_version: '1.0.0',
    ledger_schema_version: '1',
    ledger_migration_sha256: LEDGER_MIGRATION,
    authority: 'aiagent.iai.one',
    receipt_schema: 'aiagent.provider-receipt.v1',
    contract_version: '1.0.0',
    source_sha: PROVIDER_SHA,
    bundle_sha256: PROVIDER_BUNDLE,
    version_id: PROVIDER_VERSION_ID,
    deployment_id: PROVIDER_VERSION_ID,
    environment: 'staging',
    signature_algorithm: 'Ed25519',
    signing_key_id: SIGNING_KEY_ID,
    ...overrides,
  };
  const bytes = Buffer.from(canonical(payload), 'utf8');
  const signature = Buffer.from(await webcrypto.subtle.sign('Ed25519', signingKeyPair.privateKey, bytes)).toString('base64url');
  return {
    ...payload,
    receipt_hash: createHash('sha256').update(bytes).digest('hex'),
    signature: corruptSignature
      ? `${signature.startsWith('A') ? 'B' : 'A'}${signature.slice(1)}`
      : signature,
  };
}

function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  throw new Error('invalid fixture');
}

function successfulFetch({
  data = validData(),
  runOverrides = {},
  receiptOverrides = {},
  corruptSignature = false,
  calls = [],
} = {}) {
  return async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/v1/ai/chat')) return contractResponse(data);
    if (url.includes('/v1/runs/')) {
      return new Response(JSON.stringify({ ok: true, run: runFor(data, runOverrides) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.endsWith('/v1/ai/verify')) {
      const verifyRequestId = options.headers['X-Request-ID'];
      const receipt = await signedReceiptFor(data, receiptOverrides, corruptSignature);
      return contractResponse({
        receipt_id: data.receipt_id,
        verified: true,
        verification_method: 'ed25519-canonical-payload-sha256',
        execution_status: 'success',
        receipt,
      }, verifyRequestId);
    }
    throw new Error(`unexpected test URL ${url}`);
  };
}

test('staging chat uses canonical AIAGENT then reconciles run and signed receipt', async () => {
  const calls = [];
  const result = await callAiagentChat({
    messages: [{ role: 'user', content: 'hello' }],
    model: 'iai-one/iris-3',
    maxTokens: 120,
    requestId: REQUEST_ID,
    env: { ...STAGING_ENV, UNTRUSTED_PROVIDER_URL: 'https://attacker.invalid/v1/chat' },
    fetchImpl: successfulFetch({ calls }),
  });

  assert.deepEqual(calls.map((call) => new URL(call.url).pathname), [
    '/v1/ai/chat', `/v1/runs/${result.data.run_id}`, '/v1/ai/verify',
  ]);
  const invocation = calls[0];
  assert.equal(invocation.url, 'https://staging-api.aiagent.iai.one/v1/ai/chat');
  assert.equal(invocation.options.method, 'POST');
  assert.equal(invocation.options.headers.Authorization, `Bearer ${API_KEY}`);
  assert.equal(invocation.options.headers['Idempotency-Key'], REQUEST_ID);
  assert.equal(invocation.options.headers['X-Request-ID'], REQUEST_ID);
  assert.equal(invocation.options.headers['X-Trace-ID'], REQUEST_ID);
  assert.equal(invocation.options.headers['X-Tenant-ID'], 'omdala-com');
  assert.equal(invocation.options.headers['X-Actor-Role'], 'agent');
  assert.equal(invocation.options.headers['X-Surface'], 'agent');
  assert.equal(invocation.options.headers['X-Workspace-ID'], undefined);
  assert.equal(invocation.options.headers['X-Actor-ID'], undefined);
  assert.deepEqual(JSON.parse(invocation.options.body), {
    model: 'iai-one/iris-3',
    messages: [{ role: 'user', content: 'hello' }],
    max_tokens: 120,
    request_id: REQUEST_ID,
    task_type: 'chat',
    tenant_id: 'omdala-com',
    risk_level: 'low',
    data_sensitivity: 'internal',
  });
  assert.equal(result.receipt.receipt_hash.length, 64);
  assert.equal(result.run.status, 'success');
});

test('production origin and workspace are fixed constants', () => {
  const config = resolveAiagentConfiguration({
    ...STAGING_ENV,
    AIAGENT_ENVIRONMENT: 'production',
    UNTRUSTED_PROVIDER_URL: 'https://attacker.invalid',
  });
  assert.equal(config.origin, 'https://api.aiagent.iai.one');
  assert.equal(config.workspaceId, 'omdala-com-production');
  assert.equal(config.tenantId, 'omdala-com');
});

test('configuration and invocation validation fail before network access', async () => {
  const cases = [
    { env: { ...STAGING_ENV, AIAGENT_ENVIRONMENT: 'preview' }, model: 'iai-one/iris-3' },
    { env: { ...STAGING_ENV, AIAGENT_API_KEY: 'bad' }, model: 'iai-one/iris-3' },
    { env: { ...STAGING_ENV, AIAGENT_EXPECTED_PROVIDER_SHA: '' }, model: 'iai-one/iris-3' },
    { env: STAGING_ENV, model: 'vendor-model' },
  ];
  for (const value of cases) {
    let calls = 0;
    await assert.rejects(
      callAiagentChat({
        messages: [{ role: 'user', content: 'hello' }],
        model: value.model,
        maxTokens: 10,
        requestId: REQUEST_ID,
        env: value.env,
        fetchImpl: async () => { calls += 1; },
      }),
      AiagentContractError,
    );
    assert.equal(calls, 0);
  }
});

test('response verification fails closed on identity, usage, cost, and pins', async () => {
  const mutations = [
    { tenant_id: 'wrong-tenant' },
    { workspace_id: 'wrong-workspace' },
    { provider: 'other' },
    { receipt_id: '' },
    { usage: { input_tokens: 10, output_tokens: 5, total_tokens: 16, token_usage_status: 'provider_reported' } },
    { cost_usd: null },
    { cost_status: 'estimated_unverified' },
    { cost_ledger_status: 'unavailable' },
    { billing_eligible: false },
    { budget: { limit_usd: 0.25, reserved_usd: 0.002, used_usd: 0.001, remaining_usd: 0.249,
      reservation_basis: 'configured_rate_conservative_ceiling' } },
    { ledger_bundle_sha256: 'f'.repeat(64) },
  ];
  for (const mutation of mutations) {
    await assert.rejects(
      callAiagentChat({
        messages: [{ role: 'user', content: 'hello' }],
        model: 'iai-one/iris-3',
        maxTokens: 10,
        requestId: REQUEST_ID,
        env: STAGING_ENV,
        fetchImpl: successfulFetch({ data: validData(mutation) }),
      }),
      /AIAGENT_CONTRACT_MISMATCH/,
    );
  }
});

test('run and independently verified receipt are mandatory', async () => {
  await assert.rejects(callAiagentChat({
    messages: [{ role: 'user', content: 'hello' }], model: 'iai-one/iris-3', maxTokens: 10,
    requestId: REQUEST_ID, env: STAGING_ENV,
    fetchImpl: successfulFetch({ runOverrides: { status: 'running' } }),
  }), /Persisted run does not reconcile/);

  await assert.rejects(callAiagentChat({
    messages: [{ role: 'user', content: 'hello' }], model: 'iai-one/iris-3', maxTokens: 10,
    requestId: REQUEST_ID, env: STAGING_ENV,
    fetchImpl: successfulFetch({ corruptSignature: true }),
  }), /Receipt signature is invalid/);
});

test('transport ambiguity reports fail closed and never selects an alternate provider', async () => {
  let calls = 0;
  await assert.rejects(
    callAiagentChat({
      messages: [{ role: 'user', content: 'hello' }],
      model: 'iai-one/iris-3',
      maxTokens: 10,
      requestId: REQUEST_ID,
      env: STAGING_ENV,
      fetchImpl: async () => {
        calls += 1;
        throw new Error('network lost after send');
      },
    }),
    /AIAGENT_TRANSPORT_UNVERIFIED.*same idempotency key/,
  );
  assert.equal(calls, 1);
});

test('worker health is configuration-only and honest about readiness', () => {
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { fetchCalls += 1; };
  try {
    const ready = createWorkerHealthPayload({
      now: new Date('2026-10-08T00:00:00.000Z'), uptime: 42, env: STAGING_ENV,
    });
    const degraded = createWorkerHealthPayload({ now: new Date(), uptime: 42, env: {} });
    assert.equal(ready.status, 'ok');
    assert.equal(ready.ai.status, 'configured');
    assert.equal(degraded.status, 'degraded');
    assert.equal(ready.aiHealthMode, 'configuration-only-no-model-call');
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
