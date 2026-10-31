// WO-T2-21 (AI-01 prep): Om AI session bridge credential. PREP_UNDER_ASSUMPTION(AI-01, bridge as drafted)
// Every claim has a negative test: each forged token below carries a VALID signature, so
// a rejection proves the claim check itself and not just the HMAC.
import { describe, expect, it } from "vitest";
import app from "./index";
import { BRIDGE_SCOPES, accountSubFor, isRouteAllowed } from "./om-ai-bridge";

const SECRET = "test_om_ai_bridge_secret_value_0123456789";
const env = { ENVIRONMENT: "test", MAGIC_LINK_SECRET: SECRET };
const encoder = new TextEncoder();
const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");

async function hmac(message: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message))));
}
async function sessionCookie(email: string, sid = crypto.randomUUID()) {
  const part = b64(encoder.encode(JSON.stringify({ jti: crypto.randomUUID(), sid, email, type: "access", exp: Date.now() + 3_600_000 })));
  return { cookie: `omdala_access_token=${part}.${await hmac(part)}`, sid };
}
async function forge(claims: Record<string, unknown>) {
  const part = b64(encoder.encode(JSON.stringify(claims)));
  return `omb1.${part}.${await hmac(`omdala:om-ai-bridge:v1:${part}`)}`;
}
const decode = (token: string) => JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as Record<string, unknown>;
const call = (path: string, init: RequestInit = {}, bindings: Record<string, unknown> = env) =>
  app.request(`http://localhost${path}`, init, bindings);
const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
const json = (headers: Record<string, string>, body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json", ...headers },
  body: JSON.stringify(body),
});
const errorCode = async (r: Response) => ((await r.json()) as { error: { code: string } }).error.code;

async function workspaceFor(email: string) {
  const { cookie } = await sessionCookie(email);
  const created = await call("/v1/workspaces", json({ cookie }, { name: `ws-${crypto.randomUUID().slice(0, 6)}`, type: "family" }));
  const body = (await created.json()) as { data?: { workspace?: { id: string } }; workspace?: { id: string } };
  return body.data?.workspace?.id ?? body.workspace?.id;
}

async function mint(email: string, scopes: string[] = ["session:read", "profile:read", "preferences:read", "workspaces:read"]) {
  const ws = await workspaceFor(email);
  const session = await sessionCookie(email);
  const response = await call("/v1/auth/om-ai/bridge-token", json({ cookie: session.cookie }, { workspaceId: ws, scopes }));
  const data = ((await response.clone().json()) as { data: Record<string, unknown> }).data;
  return { response, ws: ws!, session, token: data?.token as string, data };
}

describe("minting", () => {
  it("returns the credential in the body only, never as a cookie, with the drafted claims", async () => {
    const { response, token, data, ws } = await mint("mint@example.test");
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");
    const claims = decode(token);
    expect(claims).toMatchObject({ aud: "om-ai", ws, sub: await accountSubFor(env as never, "mint@example.test", false) });
    expect(claims.scope).toEqual(["preferences:read", "profile:read", "session:read", "workspaces:read"]);
    expect(Number.isInteger(claims.iat) && Number.isInteger(claims.exp)).toBe(true);
    expect((claims.exp as number) - (claims.iat as number)).toBe(900);
    expect(claims.iat as number).toBeLessThan(Date.now() / 1000 + 5); // seconds, not milliseconds
    expect(claims).not.toHaveProperty("email");
    expect((data as { expiresIn: number }).expiresIn).toBe(900);
    expect(JSON.stringify(data)).not.toContain("refresh");
  });

  it("uses a stored, stable sub: the same across mints and secret rotation, different per account, not derived from the email", async () => {
    const first = await mint("stable@example.test");
    const second = await mint("stable@example.test");
    const other = await mint("different@example.test");
    const sub = decode(first.token).sub;
    expect(decode(second.token).sub).toBe(sub);
    expect(decode(other.token).sub).not.toBe(sub);
    expect(sub).toMatch(/^acct_[0-9a-f]{32}$/);
    expect(await accountSubFor(env as never, "never-minted@example.test", false)).toBeNull();
    // rotating the signing secret invalidates old tokens but does not move the account id
    const rotated = { ...env, MAGIC_LINK_SECRET: `${SECRET}_rotated` };
    expect(await accountSubFor(rotated as never, "stable@example.test", false)).toBe(sub);
    expect(JSON.stringify(decode(first.token))).not.toContain("stable@example.test");
  });

  it("requires an authenticated session", async () => {
    expect((await call("/v1/auth/om-ai/bridge-token", json({}, { workspaceId: "x", scopes: ["session:read"] }))).status).toBe(401);
  });

  it("refuses a workspace the account does not own, and another account's workspace (404, no leak)", async () => {
    const foreign = await workspaceFor("owner@example.test");
    const { cookie } = await sessionCookie("intruder@example.test");
    const response = await call("/v1/auth/om-ai/bridge-token", json({ cookie }, { workspaceId: foreign, scopes: ["session:read"] }));
    expect(response.status).toBe(404);
    expect(await errorCode(response)).toBe("workspace_not_found");
    const missing = await call("/v1/auth/om-ai/bridge-token", json({ cookie }, { workspaceId: "ws_does_not_exist", scopes: ["session:read"] }));
    expect(missing.status).toBe(404);
  });

  it("rejects malformed requests and unknown scopes", async () => {
    const bodies = (ws: string | undefined): unknown[] => [
      {}, { workspaceId: ws }, { workspaceId: ws, scopes: [] }, { workspaceId: ws, scopes: "session:read" },
      { workspaceId: 7, scopes: ["session:read"] }, { workspaceId: "", scopes: ["session:read"] },
      ...[["admin"], ["session:write"], ["session:read", "billing:read"], ["*"], [null], ["__proto__"], ["constructor"]].map((scopes) => ({ workspaceId: ws, scopes })),
    ];
    // the mint rate limit is per account, so spread the attempts over several accounts
    let index = 0;
    let email = "";
    let ws: string | undefined;
    let cookie = "";
    for (const body of bodies("placeholder")) {
      if (index % 8 === 0) {
        email = `bad-${crypto.randomUUID().slice(0, 8)}@example.test`;
        ws = await workspaceFor(email);
        cookie = (await sessionCookie(email)).cookie;
      }
      index += 1;
      const patched = JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
      if (patched.workspaceId === "placeholder") patched.workspaceId = ws;
      const response = await call("/v1/auth/om-ai/bridge-token", json({ cookie }, patched));
      expect(response.status, JSON.stringify(patched)).toBe(400);
    }
  });

  it("limits minting per account (429 rate_limited) and live credentials per session (429 bridge_credential_limit)", async () => {
    const email = `limit-${crypto.randomUUID().slice(0, 8)}@example.test`;
    const ws = await workspaceFor(email);
    const session = await sessionCookie(email);
    const attempt = () => call("/v1/auth/om-ai/bridge-token", json({ cookie: session.cookie }, { workspaceId: ws, scopes: ["session:read"] }));
    const statuses: number[] = [];
    const codes: string[] = [];
    for (let i = 0; i < 6; i++) {
      const response = await attempt();
      statuses.push(response.status);
      if (response.status !== 200) codes.push(await errorCode(response));
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    expect(codes).toEqual(["bridge_credential_limit"]);
    // another session of the same account has its own allowance
    const other = await sessionCookie(email);
    expect((await call("/v1/auth/om-ai/bridge-token", json({ cookie: other.cookie }, { workspaceId: ws, scopes: ["session:read"] }))).status).toBe(200);
    // the per-account mint rate limit (10 per minute) now answers
    for (let i = 0; i < 4; i++) await attempt();
    const limited = await attempt();
    expect(limited.status).toBe(429);
    expect(await errorCode(limited)).toBe("rate_limited");
  });

  it("frees a slot when a credential is revoked", async () => {
    const email = `free-${crypto.randomUUID().slice(0, 8)}@example.test`;
    const ws = await workspaceFor(email);
    const session = await sessionCookie(email);
    const mintOne = async () => call("/v1/auth/om-ai/bridge-token", json({ cookie: session.cookie }, { workspaceId: ws, scopes: ["session:read"] }));
    const first = ((await (await mintOne()).json()) as { data: { token: string } }).data.token;
    for (let i = 0; i < 4; i++) await mintOne();
    expect((await mintOne()).status).toBe(429);
    await call("/v1/auth/om-ai/bridge-token/revoke", { method: "POST", headers: bearer(first) });
    expect((await mintOne()).status).toBe(200);
  });

  it("a bridge credential cannot mint another one", async () => {
    const { token, ws } = await mint("chain@example.test");
    const response = await call("/v1/auth/om-ai/bridge-token", json(bearer(token), { workspaceId: ws, scopes: ["session:read"] }));
    expect(response.status).toBe(403);
    expect(await errorCode(response)).toBe("bridge_scope_forbidden");
  });
});

describe("what a valid credential can read", () => {
  it("reads the released set as its owner, and workspaces only for its own ws", async () => {
    const { token, ws } = await mint("reader@example.test");
    for (const path of ["/v1/auth/session", "/v1/account/profile", "/v1/account/preferences"]) {
      expect((await call(path, { headers: bearer(token) })).status).toBe(200);
    }
    const session = (await (await call("/v1/auth/session", { headers: bearer(token) })).json()) as { data: { email: string } };
    expect(session.data.email).toBe("reader@example.test");
    const list = (await (await call("/v1/workspaces", { headers: bearer(token) })).json()) as { data: { workspaces: { id: string }[] } };
    expect(list.data.workspaces.map((w) => w.id)).toEqual([ws]);
    expect((await call(`/v1/workspaces/${ws}`, { headers: bearer(token) })).status).toBe(200);
  });

  it("does not see a second workspace of the same account", async () => {
    const { token, session } = await mint("two@example.test");
    const other = (await (await call("/v1/workspaces", json({ cookie: session.cookie }, { name: "second-ws", type: "family" }))).json()) as { data?: { workspace?: { id: string } }; workspace?: { id: string } };
    const otherId = other.data?.workspace?.id ?? other.workspace?.id;
    expect(otherId).toBeTruthy();
    expect((await call(`/v1/workspaces/${otherId}`, { headers: bearer(token) })).status).toBe(404);
  });

  it("is limited to the scopes it was minted with", async () => {
    const { token } = await mint("narrow@example.test", ["profile:read"]);
    expect((await call("/v1/account/profile", { headers: bearer(token) })).status).toBe(200);
    for (const path of ["/v1/auth/session", "/v1/account/preferences", "/v1/workspaces"]) {
      const response = await call(path, { headers: bearer(token) });
      expect(response.status).toBe(403);
      expect(await errorCode(response)).toBe("bridge_scope_forbidden");
    }
  });

  it("cannot reach writes, security, billing, notifications, analytics or AI", async () => {
    const { token } = await mint("wide@example.test");
    const attempts: [string, string][] = [
      ["PUT", "/v1/account/profile"], ["PUT", "/v1/account/preferences"], ["POST", "/v1/workspaces"],
      ["GET", "/v1/billing/subscriptions"], ["GET", "/v1/billing/usage"], ["GET", "/v1/notifications"],
      ["GET", "/v1/analytics/dashboard"], ["POST", "/v1/analytics/track"], ["POST", "/v1/security/api-keys"],
      ["POST", "/v1/security/service-token"], ["GET", "/v1/security/csrf"], ["POST", "/v1/ai/chat"], ["GET", "/v1/ai/models"],
      ["DELETE", "/v1/workspaces"], ["POST", "/v1/auth/logout"], ["POST", "/v1/auth/refresh"],
    ];
    for (const [method, path] of attempts) {
      const response = await call(path, { method, headers: { ...bearer(token), "content-type": "application/json" }, body: method === "GET" ? undefined : "{}" });
      expect([403, 404], `${method} ${path}`).toContain(response.status);
      if (response.status === 403) expect(await errorCode(response)).toBe("bridge_scope_forbidden");
    }
  });

  it("route matching is exact: no trailing segments, no prefix tricks", () => {
    const all = Object.keys(BRIDGE_SCOPES) as (keyof typeof BRIDGE_SCOPES)[];
    expect(isRouteAllowed(all, "GET", "/v1/workspaces/abc")).toBe(true);
    for (const path of ["/v1/workspaces/abc/extra", "/v1/workspaces/", "/v1/workspacesabc", "/v1/auth/session/", "/v1/auth/sessions", "/v1/account/profile/x"]) {
      expect(isRouteAllowed(all, "GET", path), path).toBe(false);
    }
    expect(isRouteAllowed(all, "get", "/v1/auth/session")).toBe(false);
    expect(isRouteAllowed([], "GET", "/v1/auth/session")).toBe(false);
  });
});

describe("every claim is checked (valid signature, bad claim)", () => {
  async function claimsFor(label: string) {
    const { token } = await mint(`${label.split("@")[0]}-${crypto.randomUUID().slice(0, 8)}@example.test`);
    return decode(token);
  }
  const reads = async (token: string) => (await call("/v1/auth/session", { headers: bearer(token) })).status;

  it("accepts the unmodified claims (control)", async () => {
    expect(await reads(await forge(await claimsFor("control@example.test")))).toBe(200);
  });

  it.each([
    ["aud wrong", { aud: "om-ai-evil" }], ["aud missing", { aud: undefined }], ["aud array", { aud: ["om-ai"] }], ["aud case", { aud: "Om-AI" }],
    ["scope unknown", { scope: ["session:read", "admin"] }], ["scope empty", { scope: [] }], ["scope string", { scope: "session:read" }],
    ["scope missing", { scope: undefined }], ["ws missing", { ws: undefined }], ["ws empty", { ws: "" }], ["ws number", { ws: 7 }],
    ["ws different from the row", { ws: "ws_other" }], ["scope widened beyond the row", { scope: ["session:read", "profile:read", "preferences:read", "workspaces:read", "session:read"] }],
    ["sub malformed", { sub: "someone@example.test" }], ["sub of another account", { sub: "acct_00000000000000000000000000000000" }],
    ["sub missing", { sub: undefined }], ["jti not a uuid", { jti: "abc" }], ["jti missing", { jti: undefined }],
    ["jti unknown to the store", { jti: "00000000-0000-4000-8000-000000000000" }],
    ["iat in the future", { iat: Math.floor(Date.now() / 1000) + 3600, exp: Math.floor(Date.now() / 1000) + 4500 }],
    ["iat fractional", { iat: 1.5 }], ["iat string", { iat: "1" }], ["iat missing", { iat: undefined }],
    ["exp in the past", { exp: Math.floor(Date.now() / 1000) - 10 }], ["exp in milliseconds", { exp: Date.now() + 900_000 }],
    ["exp equals iat", { exp: Math.floor(Date.now() / 1000) }], ["exp missing", { exp: undefined }], ["exp string", { exp: "9999999999" }],
    ["lifetime over one hour", { exp: Math.floor(Date.now() / 1000) + 7200 }],
    ["exp changed from the row", { exp: Math.floor(Date.now() / 1000) + 1000 }],
  ])("rejects: %s", async (_name, change) => {
    const claims = { ...(await claimsFor("claims@example.test")), ...change };
    const response = await call("/v1/auth/session", { headers: bearer(await forge(claims)) });
    expect(response.status).toBe(401);
  });

  it("rejects a bad signature, a changed payload, a wrong prefix and junk", async () => {
    const { token } = await mint("sig@example.test");
    const [prefixAndPayload, signature] = [token.slice(0, token.lastIndexOf(".")), token.slice(token.lastIndexOf(".") + 1)];
    const flipped = `${prefixAndPayload}.${signature.slice(0, -2)}${signature.endsWith("AA") ? "BB" : "AA"}`;
    const claims = decode(token);
    const reencoded = `omb1.${b64(encoder.encode(JSON.stringify({ ...claims, ws: "x" })))}.${signature}`;
    for (const bad of [flipped, reencoded, token.replace("omb1.", "omb2."), `${token}.extra`, "omb1.", "omb1.a.b", "omb1..", `${token.slice(5)}`]) {
      expect((await call("/v1/auth/session", { headers: bearer(bad) })).status, bad.slice(0, 20)).toBe(401);
    }
  });

  it("a token signed without the bridge signing context is refused", async () => {
    const claims = await claimsFor("ctx@example.test");
    const part = b64(encoder.encode(JSON.stringify(claims)));
    expect(await reads(`omb1.${part}.${await hmac(part)}`)).toBe(401);
  });

  it("is not interchangeable with a browser session token", async () => {
    const { token } = await mint("swap@example.test");
    const payload = token.split(".")[1];
    expect((await call("/v1/auth/session", { headers: { cookie: `omdala_access_token=${payload}.${await hmac(payload)}` } })).status).toBe(401);
    expect((await call("/v1/auth/session", { headers: { cookie: `omdala_access_token=${token}` } })).status).toBe(401);
    const { cookie } = await sessionCookie("swap@example.test");
    const sessionToken = cookie.split("=")[1];
    expect((await call("/v1/auth/session", { headers: bearer(`omb1.${sessionToken}`) })).status).toBe(401);
  });
});

describe("revocation", () => {
  it("revokes on its own, without touching the parent session", async () => {
    const { token, session } = await mint("own@example.test");
    expect((await call("/v1/auth/session", { headers: bearer(token) })).status).toBe(200);
    const revoked = await call("/v1/auth/om-ai/bridge-token/revoke", { method: "POST", headers: bearer(token) });
    expect(revoked.status).toBe(200);
    const after = await call("/v1/auth/session", { headers: bearer(token) });
    expect(after.status).toBe(401);
    expect(await errorCode(after)).toBe("session_revoked");
    expect((await call("/v1/auth/session", { headers: { cookie: session.cookie } })).status).toBe(200);
  });

  it("revoking requires the bridge credential itself", async () => {
    const { session } = await mint("norevoke@example.test");
    const response = await call("/v1/auth/om-ai/bridge-token/revoke", { method: "POST", headers: { cookie: session.cookie } });
    expect(response.status).toBe(400);
  });

  it("is revoked when the parent session logs out, and only that session's credentials", async () => {
    const mine = await mint("logout@example.test");
    const ws = mine.ws;
    const sibling = await call("/v1/auth/om-ai/bridge-token", json({ cookie: (await sessionCookie("logout@example.test")).cookie }, { workspaceId: ws, scopes: ["session:read"] }));
    const siblingToken = ((await sibling.json()) as { data: { token: string } }).data.token;
    expect((await call("/v1/auth/logout", { method: "POST", headers: { cookie: mine.session.cookie } })).status).toBe(200);
    const after = await call("/v1/auth/session", { headers: bearer(mine.token) });
    expect(after.status).toBe(401);
    expect(await errorCode(after)).toBe("session_revoked");
    expect((await call("/v1/auth/session", { headers: bearer(siblingToken) })).status).toBe(200);
  });

  it("stops working when the credential expires", async () => {
    const { token } = await mint("expire@example.test");
    const claims = decode(token);
    const realNow = Date.now;
    Date.now = () => ((claims.exp as number) + 1) * 1000;
    try {
      expect((await call("/v1/auth/session", { headers: bearer(token) })).status).toBe(401);
    } finally {
      Date.now = realNow;
    }
  });
});

describe("administrator revoke", () => {
  const adminEnv = { ...env, OMDALA_BRIDGE_ADMIN_EMAILS: "Boss@example.test, other@example.test" };

  it("lets a configured administrator revoke any credential by id", async () => {
    const { token } = await mint(`victim-${crypto.randomUUID().slice(0, 8)}@example.test`);
    const jti = decode(token).jti as string;
    const { cookie } = await sessionCookie("boss@example.test");
    const response = await call("/v1/auth/om-ai/bridge-token/admin-revoke", json({ cookie }, { jti }), adminEnv);
    expect(response.status).toBe(200);
    expect((await call("/v1/auth/session", { headers: bearer(token) }, adminEnv)).status).toBe(401);
    const again = await call("/v1/auth/om-ai/bridge-token/admin-revoke", json({ cookie }, { jti }), adminEnv);
    expect(again.status).toBe(404);
  });

  it("refuses everyone else: ordinary accounts, an unset list, and bridge credentials", async () => {
    const { token } = await mint(`target-${crypto.randomUUID().slice(0, 8)}@example.test`);
    const jti = decode(token).jti as string;
    const { cookie } = await sessionCookie("random@example.test");
    expect((await call("/v1/auth/om-ai/bridge-token/admin-revoke", json({ cookie }, { jti }), adminEnv)).status).toBe(403);
    const boss = await sessionCookie("boss@example.test");
    expect((await call("/v1/auth/om-ai/bridge-token/admin-revoke", json({ cookie: boss.cookie }, { jti }))).status).toBe(403); // no list configured
    expect((await call("/v1/auth/om-ai/bridge-token/admin-revoke", json({}, { jti }), adminEnv)).status).toBe(401);
    expect((await call("/v1/auth/om-ai/bridge-token/admin-revoke", json(bearer(token), { jti }), adminEnv)).status).toBe(403);
    expect((await call("/v1/auth/session", { headers: bearer(token) })).status).toBe(200); // still live
  });

  it("validates the id", async () => {
    const { cookie } = await sessionCookie("boss@example.test");
    for (const jti of [undefined, 7, "nope", "../x"]) {
      expect((await call("/v1/auth/om-ai/bridge-token/admin-revoke", json({ cookie }, { jti }), adminEnv)).status).toBe(400);
    }
  });

  it("answers 501 outside the release boundary", async () => {
    const { cookie } = await sessionCookie("boss@example.test");
    const response = await call("/v1/auth/om-ai/bridge-token/admin-revoke", json({ cookie }, { jti: crypto.randomUUID() }), { ...adminEnv, ENVIRONMENT: "production" });
    expect(response.status).toBe(501);
  });
});

describe("release boundary", () => {
  it.each(["staging", "production", "preview", ""])("answers 501 in %s without reading any state", async (environment) => {
    const bindings = { ENVIRONMENT: environment, MAGIC_LINK_SECRET: SECRET };
    const { cookie } = await sessionCookie("gate@example.test");
    for (const response of [
      await call("/v1/auth/om-ai/bridge-token", json({ cookie }, { workspaceId: "x", scopes: ["session:read"] }), bindings),
      await call("/v1/auth/om-ai/bridge-token/revoke", { method: "POST" }, bindings),
      await call("/v1/auth/session", { headers: bearer(await forge({ aud: "om-ai" })) }, bindings),
    ]) {
      expect(response.status).toBe(501);
      expect(await errorCode(response)).toBe("OM_AI_BRIDGE_NOT_RELEASED");
    }
  });

  it("does not change CORS: no Om AI origin is allowed", async () => {
    const response = await call("/v1/auth/session", { method: "OPTIONS", headers: { origin: "https://om-ai.omdala.com", "access-control-request-method": "GET" } });
    expect(response.headers.get("access-control-allow-origin")).not.toBe("https://om-ai.omdala.com");
  });
});
