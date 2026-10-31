// WO-T2-29: three /v1/security surfaces are unsafe or inert, so they answer 501 not_released
// outside local, development and test until the owner approves a design.
// PREP_UNDER_ASSUMPTION(security endpoints closed until designed)
import { describe, expect, it } from "vitest";
import app from "./index";

const SECRET = "test_security_surfaces_secret_0123456789";
const CLOSED = [
  ["POST", "/v1/security/webhooks/verify", { payload: "{}", signature: "00", secret: "caller-secret" }],
  ["POST", "/v1/security/service-token", { serviceId: "svc" }],
  ["POST", "/v1/security/api-keys", { name: "k", scopes: ["read"] }],
] as const;

async function cookie(email = "sec@example.test") {
  const part = Buffer.from(JSON.stringify({ jti: crypto.randomUUID(), sid: crypto.randomUUID(), email, type: "access", exp: Date.now() + 3_600_000 })).toString("base64url");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = Buffer.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(part)))).toString("base64url");
  return `omdala_access_token=${part}.${sig}`;
}
const send = (method: string, path: string, body: unknown, env: Record<string, unknown>, headers: Record<string, string> = {} as Record<string, string>) =>
  app.request(`http://localhost${path}`, { method, headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }, env);
const code = async (r: Response) => ((await r.json()) as { error: { code: string } }).error.code;

describe("closed outside local environments", () => {
  it.each(["staging", "production", "preview", ""])("answers 501 not_released in %s, with and without a session, before reading the body", async (environment) => {
    const env = { ENVIRONMENT: environment, MAGIC_LINK_SECRET: SECRET, SERVICE_TOKEN_SECRET: SECRET };
    for (const [method, path, body] of CLOSED) {
      for (const headers of [{} as Record<string, string>, { cookie: await cookie() }]) {
        const response = await send(method, path, body, env, headers);
        expect(response.status, `${method} ${path}`).toBe(501);
        expect(await code(response)).toBe("not_released");
      }
      expect((await send(method, path, "not json", env)).status).toBe(501);
    }
  });

  it("an unset ENVIRONMENT is closed too (fail closed)", async () => {
    const response = await send("POST", "/v1/security/webhooks/verify", CLOSED[0][2], { MAGIC_LINK_SECRET: SECRET });
    expect(response.status).toBe(501);
  });

  it("leaves the other security routes alone", async () => {
    const env = { ENVIRONMENT: "production", MAGIC_LINK_SECRET: SECRET };
    const csrf = await app.request("http://localhost/v1/security/csrf", {}, env);
    expect(csrf.status).toBe(200);
    const verify = await send("POST", "/v1/security/service-token/verify", { token: "x" }, env);
    expect(verify.status).not.toBe(501);
  });
});

describe("still works where it is local", () => {
  it.each(["test", "development", "local"])("%s serves the three routes", async (environment) => {
    const env = { ENVIRONMENT: environment, MAGIC_LINK_SECRET: SECRET, SERVICE_TOKEN_SECRET: SECRET };
    const headers = { cookie: await cookie() };
    expect((await send("POST", "/v1/security/webhooks/verify", CLOSED[0][2], env)).status).toBe(200);
    // sessions are only accepted without a database in test and development
    if (environment === "local") return;
    expect((await send("POST", "/v1/security/service-token", CLOSED[1][2], env, headers)).status).toBe(201);
    expect((await send("POST", "/v1/security/api-keys", CLOSED[2][2], env, headers)).status).toBe(201);
  });
});
