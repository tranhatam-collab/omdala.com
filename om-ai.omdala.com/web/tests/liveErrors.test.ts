import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { describeLiveError } from '../src/api/liveErrors.ts';

const RAW_CODE = /_|http_|\b\d{3}\b/;

test('backend down, bridge unavailable, and 5xx show a clear unavailable message', () => {
  for (const code of ['network_error', 'canonical_session_bridge_unavailable', 'ai_authority_unavailable', 'omdala_identity_authority_unavailable', 503, '502', 'http_504', 'timeout']) {
    const result = describeLiveError(code);
    assert.equal(result.kind, 'backend_unavailable', String(code));
    assert.match(result.message, /not reachable right now/);
    assert.match(result.message, /nothing was charged/);
  }
});

test('quota exhausted explains the reset and the plan option', () => {
  for (const code of ['quota_exhausted', 'free_quota_exhausted', 'usage_limit_reached']) {
    const result = describeLiveError(code);
    assert.equal(result.kind, 'quota_exhausted', code);
    assert.match(result.message, /free practice time/);
    assert.match(result.message, /resets tomorrow/);
  }
});

test('provider 429 shows a busy-and-retry message, not a raw error', () => {
  for (const code of [429, '429', 'http_429', 'rate_limited', 'provider_rate_limited']) {
    const result = describeLiveError(code);
    assert.equal(result.kind, 'provider_busy', String(code));
    assert.match(result.message, /busy right now/);
  }
});

test('plan and billing refusals are explained', () => {
  assert.equal(describeLiveError('plan_upgrade_required').kind, 'plan_required');
  assert.equal(describeLiveError('PLAN_CHANGE_REQUIRES_BILLING').kind, 'billing_required');
  assert.equal(describeLiveError('401').kind, 'sign_in_required');
});

test('unknown, empty, and missing codes get a generic message and never echo the code', () => {
  for (const code of ['create_failed', '', null, undefined, 'weird_internal_code_42']) {
    const result = describeLiveError(code);
    assert.equal(result.kind, 'unknown');
    assert.ok(result.message.length > 20);
    assert.doesNotMatch(result.message, /weird_internal_code_42|create_failed/);
  }
});

test('no message is blank and none contains a raw error token', () => {
  for (const code of ['network_error', 'quota_exhausted', 'rate_limited', '401', 'plan_upgrade_required', 'PLAN_CHANGE_REQUIRES_BILLING', 'x']) {
    const { message } = describeLiveError(code);
    assert.ok(message.trim().length > 0);
    assert.doesNotMatch(message, RAW_CODE);
  }
});

test('the live card renders mapped messages instead of interpolating the raw error code', () => {
  const source = readFileSync(new URL('../src/components/LiveExecutionCard.tsx', import.meta.url), 'utf8');
  assert.match(source, /describeLiveError\(error\)\.message/);
  assert.doesNotMatch(source, /Live execution error: \{error\}/);
});
