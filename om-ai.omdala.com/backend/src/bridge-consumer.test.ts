import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  authorizeBridgeRequest,
  BRIDGE_MAX_LIFETIME_SECONDS,
  type BridgeClaims,
  type BridgeDeps,
} from './bridge/consumer.js';

// PREP_UNDER_ASSUMPTION(CTL-03, PostgreSQL): the claim shape follows the PROPOSED bridge in
// docs/contracts/OMAI_SESSION_BRIDGE_CONTRACT_DRAFT.md; signatures are faked by an injected verifier.

const NOW_MS = Date.UTC(2026, 9, 31, 12, 0, 0);
const NOW_S = Math.floor(NOW_MS / 1000);

const goodClaims = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  sub: 'acct_001',
  aud: 'om-ai',
  scope: ['om_ai.live:read', 'om_ai.live:write'],
  ws: 'ws_001',
  jti: 'jti_001',
  iat: NOW_S - 10,
  exp: NOW_S + 600,
  ...over,
});

function deps(claims: unknown, revoked: Set<string> = new Set(), extra: Partial<BridgeDeps> = {}): BridgeDeps {
  return {
    verify: async (token) => (token === 'good.token' ? claims : null),
    isRevoked: async (c: BridgeClaims) => revoked.has(c.jti),
    now: () => NOW_MS,
    ...extra,
  };
}

const get = (path: string, extra: Record<string, unknown> = {}) => ({
  method: 'GET',
  path,
  authorization: 'Bearer good.token',
  ...extra,
});

test('accepted claims produce an owner principal bound to the account id', async () => {
  const decision = await authorizeBridgeRequest(get('/v2/live/sessions'), deps(goodClaims()));
  assert.equal(decision.ok, true);
  if (decision.ok) {
    assert.deepEqual(decision.auth, { userId: 'acct_001', role: 'owner' });
    assert.equal(decision.claims.ws, 'ws_001');
  }
});

test('missing, malformed, and non-bearer authorization is unauthenticated', async () => {
  for (const authorization of [undefined, '', 'good.token', 'Basic abc', 'Bearer ', 'Bearer a b', 'bearer good.token']) {
    const decision = await authorizeBridgeRequest({ method: 'GET', path: '/v2/live/sessions', authorization }, deps(goodClaims()));
    assert.deepEqual(decision, { ok: false, status: 401, code: 'unauthenticated' }, String(authorization));
  }
});

test('an unverifiable or throwing verifier gives invalid_or_expired_token', async () => {
  const unknown = await authorizeBridgeRequest({ ...get('/v2/live/sessions'), authorization: 'Bearer other.token' }, deps(goodClaims()));
  assert.deepEqual(unknown, { ok: false, status: 401, code: 'invalid_or_expired_token' });
  const thrown = await authorizeBridgeRequest(get('/v2/live/sessions'), deps(goodClaims(), new Set(), { verify: async () => { throw new Error('boom'); } }));
  assert.deepEqual(thrown, { ok: false, status: 401, code: 'invalid_or_expired_token' });
});

test('expired tokens are rejected, including a millisecond expiry and an over-long lifetime', async () => {
  const cases = [
    goodClaims({ exp: NOW_S - 1 }),
    goodClaims({ exp: NOW_S }),
    goodClaims({ exp: NOW_MS + 600_000 }),
    goodClaims({ iat: NOW_S - 10, exp: NOW_S - 10 + BRIDGE_MAX_LIFETIME_SECONDS + 1 }),
    goodClaims({ iat: NOW_S + 600, exp: NOW_S + 900 }),
    goodClaims({ exp: 'soon' }),
    goodClaims({ exp: NOW_S + 5.5 }),
  ];
  for (const claims of cases) {
    const decision = await authorizeBridgeRequest(get('/v2/live/sessions'), deps(claims));
    assert.deepEqual(decision, { ok: false, status: 401, code: 'invalid_or_expired_token' }, JSON.stringify(claims));
  }
});

test('claim shape violations are rejected: audience, subject, workspace, scope, jti', async () => {
  const cases = [
    goodClaims({ aud: 'api.omdala.com' }),
    goodClaims({ aud: undefined }),
    goodClaims({ sub: '' }),
    goodClaims({ sub: 42 }),
    goodClaims({ ws: undefined }),
    goodClaims({ scope: [] }),
    goodClaims({ scope: 'om_ai.live:read' }),
    goodClaims({ scope: ['om_ai.live:read', 7] }),
    goodClaims({ jti: '' }),
    null,
    'claims',
    [],
  ];
  for (const claims of cases) {
    const decision = await authorizeBridgeRequest(get('/v2/live/sessions'), deps(claims));
    assert.deepEqual(decision, { ok: false, status: 401, code: 'invalid_or_expired_token' }, JSON.stringify(claims));
  }
});

test('a revoked credential or parent session is session_revoked, and a down revocation store fails closed', async () => {
  const revoked = await authorizeBridgeRequest(get('/v2/live/sessions'), deps(goodClaims(), new Set(['jti_001'])));
  assert.deepEqual(revoked, { ok: false, status: 401, code: 'session_revoked' });

  const down = await authorizeBridgeRequest(
    get('/v2/live/sessions'),
    deps(goodClaims(), new Set(), { isRevoked: async () => { throw new Error('store down'); } }),
  );
  assert.deepEqual(down, { ok: false, status: 503, code: 'session_authority_unavailable' });
});

test('replay: the same valid token is accepted again until exp or revocation, then refused', async () => {
  const claims = goodClaims();
  const revoked = new Set<string>();
  const d = deps(claims, revoked);
  assert.equal((await authorizeBridgeRequest(get('/v2/live/sessions'), d)).ok, true);
  assert.equal((await authorizeBridgeRequest(get('/v2/live/sessions'), d)).ok, true);

  revoked.add('jti_001');
  assert.equal((await authorizeBridgeRequest(get('/v2/live/sessions'), d)).ok, false);

  const later = deps(goodClaims(), new Set(), { now: () => NOW_MS + 601_000 });
  assert.deepEqual(await authorizeBridgeRequest(get('/v2/live/sessions'), later), { ok: false, status: 401, code: 'invalid_or_expired_token' });
});

test('replaying a token for another workspace or account is refused', async () => {
  const d = deps(goodClaims());
  assert.deepEqual(
    await authorizeBridgeRequest(get('/v2/live/sessions', { workspaceId: 'ws_other' }), d),
    { ok: false, status: 403, code: 'workspace_mismatch' },
  );
  assert.deepEqual(
    await authorizeBridgeRequest(get('/v2/live/sessions', { accountId: 'acct_other' }), d),
    { ok: false, status: 403, code: 'account_mismatch' },
  );
  assert.equal((await authorizeBridgeRequest(get('/v2/live/sessions', { workspaceId: 'ws_001', accountId: 'acct_001' }), d)).ok, true);
});

test('scope is enforced per route: read-only tokens cannot write', async () => {
  const readOnly = deps(goodClaims({ scope: ['om_ai.live:read'] }));
  assert.equal((await authorizeBridgeRequest(get('/v2/live/memory/profile'), readOnly)).ok, true);
  for (const [method, path] of [['POST', '/v2/live/sessions/create'], ['PATCH', '/v2/live/memory/profile'], ['POST', '/v2/live/moderation/check']] as const) {
    const decision = await authorizeBridgeRequest({ method, path, authorization: 'Bearer good.token' }, readOnly);
    assert.deepEqual(decision, { ok: false, status: 403, code: 'forbidden_scope' }, `${method} ${path}`);
  }
  const wrongScope = deps(goodClaims({ scope: ['billing:read'] }));
  assert.equal((await authorizeBridgeRequest(get('/v2/live/sessions'), wrongScope)).ok, false);
});

test('unknown routes, other methods, traversal, and non-Om AI paths are refused with a valid token', async () => {
  const d = deps(goodClaims());
  const refused: Array<[string, string]> = [
    ['GET', '/v2/live/plans/upgrade'],
    ['POST', '/v2/live/plans/upgrade'],
    ['DELETE', '/v2/live/sessions/abc'],
    ['GET', '/v2/reality/devices'],
    ['GET', '/v1/account/profile'],
    ['GET', '/v1/security/api-keys'],
    ['GET', '/v2/live/sessions/a/b'],
    ['GET', '/v2/live/../reality/devices'],
    ['GET', '/v2/live/personas%2F..'],
    ['GET', '/health'],
    ['GET', '/'],
    ['POST', '/v2/live/lessons/x/start'],
  ];
  for (const [method, path] of refused) {
    const decision = await authorizeBridgeRequest({ method, path, authorization: 'Bearer good.token' }, d);
    assert.deepEqual(decision, { ok: false, status: 403, code: 'route_not_allowed' }, `${method} ${path}`);
  }
  // Query strings do not change which route matches.
  assert.equal((await authorizeBridgeRequest(get('/v2/live/sessions?status=ended'), d)).ok, true);
});

test('a bridge credential never carries admin rights, even if the claims try to', async () => {
  const decision = await authorizeBridgeRequest(
    get('/v2/live/sessions'),
    deps(goodClaims({ role: 'facility_admin', admin: true })),
  );
  assert.equal(decision.ok, true);
  if (decision.ok) assert.equal(decision.auth.role, 'owner');
});

test('the consumer is not wired into any route, app, or the public boundary', () => {
  for (const file of ['app.ts', 'server.ts', 'index.ts', 'routes.ts', 'publicBoundary.ts', 'auth.ts', 'routes/live.ts']) {
    const source = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /bridge\/consumer/u, file);
  }
});
