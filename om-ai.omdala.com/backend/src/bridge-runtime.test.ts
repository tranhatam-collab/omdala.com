import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import Fastify from 'fastify';
import { createIntrospectionVerifier, createPublishedKeyVerifier } from './bridge/adapters.js';
import { BRIDGE_WORKSPACE_HEADER, installBridgeAuth } from './bridge/hook.js';
import type { BridgeClaims, BridgeDeps, BridgeVerifier } from './bridge/consumer.js';
import { registerRoutes } from './routes.js';

// Runtime negatives for the PROPOSED session bridge (docs/contracts/OMAI_SESSION_BRIDGE_CONTRACT_DRAFT.md,
// sections 8 and 10), run through a real Fastify app and the real /v2/live routes. Both token options are
// exercised behind the same BridgeVerifier port. PREP_UNDER_ASSUMPTION(AI-01, bridge as drafted).

const NOW_MS = Date.UTC(2026, 9, 31, 12, 0, 0);
const NOW_S = Math.floor(NOW_MS / 1000);
const ISSUER = 'api.omdala.com';
const KID = 'k1';

// The live store is a process singleton, so every claim set gets its own account unless a test fixes one.
let accountCounter = 0;
const nextSub = () => `acct_${String(++accountCounter).padStart(32, '0')}`;

const claims = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  iss: ISSUER,
  sub: nextSub(),
  aud: 'om-ai',
  scope: ['om_ai.live:read', 'om_ai.live:write'],
  ws: 'ws_001',
  jti: 'jti_001',
  iat: NOW_S - 10,
  exp: NOW_S + 600,
  ...over,
});

// ---- option (b): real Ed25519 JWTs signed in the test -----------------------------------------
const signing = generateKeyPairSync('ed25519');
const otherSigning = generateKeyPairSync('ed25519');
const b64 = (value: unknown) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

function jwt(payload: Record<string, unknown>, opts: { alg?: string; kid?: string; key?: KeyObject; tamper?: boolean } = {}): string {
  const header = b64({ alg: opts.alg ?? 'EdDSA', kid: opts.kid ?? KID, typ: 'JWT' });
  const body = b64(payload);
  const signature = sign(null, Buffer.from(`${header}.${body}`), opts.key ?? signing.privateKey).toString('base64url');
  const token = `${header}.${body}.${signature}`;
  return opts.tamper ? `${header}.${b64({ ...payload, scope: ['om_ai.live:read', 'om_ai.live:write', 'admin'] })}.${signature}` : token;
}

// ---- option (a): a fake API introspection endpoint ---------------------------------------------
type Introspect = (token: string) => Promise<{ active?: unknown; reason?: unknown; claims?: unknown }>;
const issued = new Map<string, Record<string, unknown>>();
const revokedTokens = new Set<string>();
let introspectDown = false;
const introspect: Introspect = async (token) => {
  if (introspectDown) throw new Error('api down');
  if (revokedTokens.has(token)) return { active: false, reason: 'revoked' };
  const found = issued.get(token);
  return found ? { active: true, claims: found } : { active: false };
};

type Adapter = {
  name: string;
  mint: (payload: Record<string, unknown>) => string;
  verify: BridgeVerifier;
  revoke: (token: string, payload: Record<string, unknown>) => void;
  down: () => void;
  up: () => void;
  revokedJtis: Set<string>;
};

const keySet = new Map<string, KeyObject>([[KID, signing.publicKey]]);
let keysDown = false;

const adapters: Adapter[] = [
  {
    name: 'introspection',
    mint: (payload) => {
      const token = `omb1.${b64(payload.jti)}.${Math.random().toString(36).slice(2)}`;
      issued.set(token, payload);
      return token;
    },
    verify: createIntrospectionVerifier((token) => introspect(token)),
    revoke: (token) => revokedTokens.add(token),
    down: () => { introspectDown = true; },
    up: () => { introspectDown = false; },
    revokedJtis: new Set(),
  },
  {
    name: 'published keys',
    mint: (payload) => jwt(payload),
    verify: createPublishedKeyVerifier({
      issuer: ISSUER,
      getKeys: () => {
        if (keysDown) throw new Error('jwks unreachable');
        return keySet;
      },
    }),
    // Offline verification only learns of revocation through a revocation check on the jti.
    revoke: (_token, payload) => revokedJtis.add(String(payload.jti)),
    down: () => { keysDown = true; },
    up: () => { keysDown = false; },
    revokedJtis: new Set(),
  },
];
const revokedJtis = adapters[1]!.revokedJtis;

function appFor(adapter: Adapter, now = NOW_MS) {
  const app = Fastify({ logger: false });
  const deps: BridgeDeps = {
    verify: adapter.verify,
    isRevoked: async (c: BridgeClaims) => revokedJtis.has(c.jti),
    now: () => now,
  };
  installBridgeAuth(app, deps);
  registerRoutes(app);
  return app;
}

type Body = { data: Record<string, unknown> | null; error: { code: string } | null };
const bearer = (token: string, extra: Record<string, string> = {}) => ({ authorization: `Bearer ${token}`, ...extra });

function assertDenied(response: { statusCode: number; headers: Record<string, unknown>; json: () => unknown }, status: number, code: string) {
  assert.equal(response.statusCode, status);
  const body = response.json() as Body;
  assert.equal(body.data, null);
  assert.equal(body.error?.code, code);
  assert.equal(response.headers['cache-control'], 'no-store');
}

for (const adapter of adapters) {
  test.describe(`bridge runtime negatives via ${adapter.name}`, () => {
    test.beforeEach(() => {
      revokedJtis.clear();
      revokedTokens.clear();
      issued.clear();
      adapter.up();
    });

    test('accepted token reaches the live routes as the account, and sees only its own sessions', async () => {
      const app = appFor(adapter);
      const mineClaims = claims();
      const mine = adapter.mint(mineClaims);
      const theirs = adapter.mint(claims({ jti: 'jti_002' }));

      const created = await app.inject({ method: 'POST', url: '/v2/live/sessions/create', headers: bearer(mine), payload: { persona_id: 'teacher_english_01', session_type: 'language_call', user_id: 'forged' } });
      assert.equal(created.statusCode, 200);
      const id = (created.json() as { data: { session_id: string } }).data.session_id;

      const list = await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(mine) });
      const sessions = (list.json() as { data: { items: Array<{ user_id: string }> } }).data.items;
      assert.equal(sessions.length, 1);
      assert.equal(sessions[0]!.user_id, mineClaims.sub);

      const foreign = await app.inject({ method: 'GET', url: `/v2/live/sessions/${id}`, headers: bearer(theirs) });
      assert.equal(foreign.statusCode, 404);
      await app.close();
    });

    test('missing or malformed token: 401 unauthenticated', async () => {
      const app = appFor(adapter);
      for (const headers of [{}, { authorization: '' }, { authorization: 'Basic abc' }, { authorization: 'Bearer' }]) {
        assertDenied(await app.inject({ method: 'GET', url: '/v2/live/sessions', headers }), 401, 'unauthenticated');
      }
      await app.close();
    });

    test('expired token: 401 invalid_or_expired_token', async () => {
      const app = appFor(adapter);
      const token = adapter.mint(claims({ exp: NOW_S - 5, iat: NOW_S - 600 }));
      assertDenied(await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(token) }), 401, 'invalid_or_expired_token');
      await app.close();
    });

    test('wrong audience: 401 invalid_or_expired_token', async () => {
      const app = appFor(adapter);
      for (const aud of ['api.omdala.com', 'admin', undefined]) {
        const token = adapter.mint(claims({ aud }));
        assertDenied(await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(token) }), 401, 'invalid_or_expired_token');
      }
      await app.close();
    });

    test('scope not granted: 403 forbidden_scope, and nothing is written', async () => {
      const app = appFor(adapter);
      const readOnly = adapter.mint(claims({ scope: ['om_ai.live:read'] }));
      const write = await app.inject({ method: 'POST', url: '/v2/live/sessions/create', headers: bearer(readOnly), payload: { persona_id: 'teacher_english_01', session_type: 'language_call' } });
      assertDenied(write, 403, 'forbidden_scope');
      const list = await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(readOnly) });
      assert.equal((list.json() as { data: { items: unknown[] } }).data.items.length, 0);
      await app.close();
    });

    test('workspace not owned (token bound to another workspace): 403 workspace_mismatch', async () => {
      const app = appFor(adapter);
      const token = adapter.mint(claims({ ws: 'ws_001' }));
      assertDenied(
        await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(token, { [BRIDGE_WORKSPACE_HEADER]: 'ws_other' }) }),
        403,
        'workspace_mismatch',
      );
      const ok = await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(token, { [BRIDGE_WORKSPACE_HEADER]: 'ws_001' }) });
      assert.equal(ok.statusCode, 200);
      await app.close();
    });

    test('revoked token: 401 session_revoked on the next call', async () => {
      const app = appFor(adapter);
      const payload = claims();
      const token = adapter.mint(payload);
      assert.equal((await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(token) })).statusCode, 200);
      adapter.revoke(token, payload);
      assertDenied(await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(token) }), 401, 'session_revoked');
      await app.close();
    });

    test('route outside the allowlist: 403 route_not_allowed with a valid token', async () => {
      const app = appFor(adapter);
      const token = adapter.mint(claims());
      for (const [method, url] of [['GET', '/v2/reality/devices'], ['POST', '/v2/live/plans/upgrade'], ['GET', '/v1/account/profile'], ['DELETE', '/v2/live/sessions/x'], ['GET', '/openapi.json']] as const) {
        assertDenied(await app.inject({ method, url, headers: bearer(token) }), 403, 'route_not_allowed');
      }
      await app.close();
    });

    test('credential authority down: 503 session_authority_unavailable, never an accept', async () => {
      const app = appFor(adapter);
      const token = adapter.mint(claims());
      adapter.down();
      assertDenied(await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(token) }), 503, 'session_authority_unavailable');
      adapter.up();
      assert.equal((await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(token) })).statusCode, 200);
      await app.close();
    });

    test('identity in headers, body or query is never used', async () => {
      const app = appFor(adapter);
      const token = adapter.mint(claims());
      const response = await app.inject({
        method: 'GET',
        url: '/v2/live/sessions?user_id=victim',
        headers: bearer(token, { 'x-user-id': 'victim', 'x-role': 'facility_admin' }),
      });
      assert.equal(response.statusCode, 200);
      assert.equal((response.json() as { data: { items: unknown[] } }).data.items.length, 0);
      await app.close();
    });
  });
}

test.describe('option (b) only: JWT-specific negatives', () => {
  const adapter = adapters[1]!;

  test('tampered payload, wrong key, unknown kid, wrong algorithm and wrong issuer are all 401', async () => {
    const app = appFor(adapter);
    const cases: Record<string, string> = {
      tampered: jwt(claims(), { tamper: true }),
      'signed by another key': jwt(claims(), { key: otherSigning.privateKey }),
      'unknown kid': jwt(claims(), { kid: 'k-unknown' }),
      'alg none': `${b64({ alg: 'none', kid: KID })}.${b64(claims())}.`,
      'alg HS256': jwt(claims(), { alg: 'HS256' }),
      'wrong issuer': jwt(claims({ iss: 'evil.example' })),
      'not a jwt': 'omb1.payload.signature.extra',
      'empty segments': '..',
    };
    for (const [name, token] of Object.entries(cases)) {
      assertDenied(await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(token) }), 401, 'invalid_or_expired_token');
      void name;
    }
    await app.close();
  });

  test('a millisecond expiry (the legacy session format) is refused', async () => {
    const app = appFor(adapter);
    const token = jwt(claims({ exp: NOW_MS + 600_000, iat: NOW_MS - 10_000 }));
    assertDenied(await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(token) }), 401, 'invalid_or_expired_token');
    await app.close();
  });
});

test.describe('option (a) only: introspection-specific negatives', () => {
  test('an inactive answer is 401, and a malformed answer is an authority fault (503)', async () => {
    const app1 = Fastify({ logger: false });
    installBridgeAuth(app1, { verify: createIntrospectionVerifier(async () => ({ active: false })), isRevoked: async () => false, now: () => NOW_MS });
    registerRoutes(app1);
    assertDenied(await app1.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer('omb1.x.y') }), 401, 'invalid_or_expired_token');
    await app1.close();

    for (const answer of [null, 'yes', {}, { active: 'true' }, { active: 1 }] as unknown[]) {
      const app = Fastify({ logger: false });
      installBridgeAuth(app, { verify: createIntrospectionVerifier(async () => answer as never), isRevoked: async () => false, now: () => NOW_MS });
      registerRoutes(app);
      assertDenied(await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer('omb1.x.y') }), 503, 'session_authority_unavailable');
      await app.close();
    }
  });

  test('an active answer with bad claims is still refused', async () => {
    const app = Fastify({ logger: false });
    installBridgeAuth(app, { verify: createIntrospectionVerifier(async () => ({ active: true, claims: { sub: 'x' } })), isRevoked: async () => false, now: () => NOW_MS });
    registerRoutes(app);
    assertDenied(await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer('omb1.x.y') }), 401, 'invalid_or_expired_token');
    await app.close();
  });
});

test('the swap is the adapter only: both options give the same status and code for every case above', async () => {
  const expectations: Array<[string, (a: Adapter) => Promise<{ status: number; code: string | undefined }>]> = [];
  const probe = async (adapter: Adapter, payload: Record<string, unknown>, headers: Record<string, string> = {}) => {
    const app = appFor(adapter);
    const token = adapter.mint(payload);
    const response = await app.inject({ method: 'GET', url: '/v2/live/sessions', headers: bearer(token, headers) });
    await app.close();
    return { status: response.statusCode, code: (response.json() as Body).error?.code };
  };
  expectations.push(['expired', (a) => probe(a, claims({ exp: NOW_S - 1, iat: NOW_S - 100 }))]);
  expectations.push(['wrong aud', (a) => probe(a, claims({ aud: 'x' }))]);
  expectations.push(['other workspace', (a) => probe(a, claims(), { [BRIDGE_WORKSPACE_HEADER]: 'ws_other' })]);
  expectations.push(['ok', (a) => probe(a, claims())]);
  for (const [name, run] of expectations) {
    const [a, b] = await Promise.all(adapters.map((adapter) => run(adapter)));
    assert.deepEqual(a, b, name);
  }
});

test('the bridge hook is not installed by the production app, server, or entrypoints', () => {
  for (const file of ['app.ts', 'server.ts', 'index.ts', 'routes.ts', 'publicBoundary.ts']) {
    const source = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /bridge\/(hook|adapters|consumer)/u, file);
  }
});
