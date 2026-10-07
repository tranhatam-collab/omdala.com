import { describe, expect, it, vi } from "vitest";

vi.mock("./db/auth-repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db/auth-repository")>()),
  isAuthSessionActive: vi.fn(async () => true),
}));

import app from "./index";

const env = {
  ENVIRONMENT: "production",
  MAGIC_LINK_SECRET: "test_magic_secret_for_ai_health_routes",
  AIAGENT_API_URL: "https://api.aiagent.iai.one",
  AIAGENT_WORKSPACE_ID: "omdala-com-production",
  AIAGENT_API_KEY: `sk-aiagent-${"a".repeat(48)}`,
};

async function accessCookie() {
  const payload = {
    jti: "11111111-1111-4111-8111-111111111111",
    sid: "22222222-2222-4222-8222-222222222222",
    email: "operator@omdala.com",
    type: "access" as const,
    exp: Date.now() + 60 * 60 * 1000,
  };
  const payloadPart = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.MAGIC_LINK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadPart),
  );
  return `omdala_access_token=${payloadPart}.${Buffer.from(
    new Uint8Array(signature),
  ).toString("base64url")}`;
}

describe("AI health cost boundary", () => {
  it("reports only the configured AIAGENT authority without provider egress or a model call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const response = await app.request(
        "http://localhost/v1/ai/health",
        { headers: { cookie: await accessCookie() } },
        env,
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        ok: true,
        data: {
          total: 1,
          modelCallExecuted: false,
          providers: [
            {
              provider: "aiagent",
              configured: true,
              origin: "https://api.aiagent.iai.one",
              contractVersion: "1.0.0",
              tenant: "omdala-com",
              probe: "configuration-only",
              directUpstreamAllowed: false,
            },
          ],
        },
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("fails closed on the legacy direct-completion endpoint without provider egress", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const response = await app.request(
        "http://localhost/v1/ai/complete",
        {
          method: "POST",
          headers: {
            cookie: await accessCookie(),
            "content-type": "application/json",
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "must never leave OMDALA" }],
          }),
        },
        env,
      );
      expect(response.status).toBe(501);
      await expect(response.json()).resolves.toMatchObject({
        ok: false,
        error: { code: "direct_ai_disabled" },
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
