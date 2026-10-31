// WO-T2-25: webhook signature verification against a local stub provider (no network, no keys).
// Records what is real (HMAC verification) and what is not built (a provider webhook receiver,
// replay refusal, event idempotency, plan changes) so the gaps are explicit before a sandbox
// provider is connected. The GAP tests flip on purpose when a receiver exists.
import { describe, expect, it } from "vitest";
import app from "./index";
import { verifyWebhookSignature } from "./security";

const env = { ENVIRONMENT: "test", MAGIC_LINK_SECRET: "test_billing_webhook_secret_0123456789" };
const SECRET = "whsec_stub_provider_secret";
const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

// The stub provider: signs the raw body with HMAC-SHA256 like a real one would.
async function stubProviderSign(body: string, secret = SECRET) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))));
}
const event = (id: string, type = "subscription.updated") =>
  JSON.stringify({ id, type, data: { plan: "pro", status: "active" } });
const verify = (body: Record<string, unknown>) =>
  app.request("http://localhost/v1/security/webhooks/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }, env);
const valid = async (r: Response) => ((await r.json()) as { data: { valid: boolean } }).data.valid;

describe("signature verification (real)", () => {
  it("accepts a correct signature, in lower or upper case hex", async () => {
    const payload = event("evt_1");
    const signature = await stubProviderSign(payload);
    expect(await verifyWebhookSignature(payload, signature, SECRET)).toBe(true);
    expect(await verifyWebhookSignature(payload, signature.toUpperCase(), SECRET)).toBe(true);
    const response = await verify({ payload, signature, secret: SECRET });
    expect(response.status).toBe(200);
    expect(await valid(response)).toBe(true);
  });

  it("rejects a changed body, a wrong secret and a signature for another body", async () => {
    const payload = event("evt_2");
    const signature = await stubProviderSign(payload);
    expect(await verifyWebhookSignature(`${payload} `, signature, SECRET)).toBe(false);
    expect(await verifyWebhookSignature(payload.replace("pro", "enterprise"), signature, SECRET)).toBe(false);
    expect(await verifyWebhookSignature(payload, signature, `${SECRET}x`)).toBe(false);
    expect(await verifyWebhookSignature(payload, await stubProviderSign(event("evt_other")), SECRET)).toBe(false);
  });

  it("treats malformed signatures and unsupported algorithms as invalid, never as an error or a pass", async () => {
    const payload = event("evt_3");
    const good = await stubProviderSign(payload);
    for (const signature of [good.slice(0, -1), good.slice(0, -2), "zz".repeat(32), `sha256=${good}`, "00", ` ${good}`, `${good}00`]) {
      expect(await verifyWebhookSignature(payload, signature, SECRET), signature.slice(0, 12)).toBe(false);
      const response = await verify({ payload, signature, secret: SECRET });
      expect(response.status).toBe(200);
      expect(await valid(response)).toBe(false);
    }
    for (const algorithm of ["md5", "sha1", "sha512", "SHA-256", ""]) {
      const response = await verify({ payload, signature: good, secret: SECRET, algorithm });
      expect(response.status).toBe(200);
      expect(await valid(response)).toBe(false);
    }
    expect(await verifyWebhookSignature(payload, good, "")).toBe(false);
  });

  it("requires payload, signature and secret", async () => {
    for (const body of [{}, { payload: "x" }, { payload: "x", signature: "00" }, { payload: "x", secret: "s" }]) {
      expect((await verify(body)).status).toBe(400);
    }
  });
});

describe("what is not built (GAP, characterization)", () => {
  it("has no provider webhook receiver: every plausible path answers 404 and changes nothing", async () => {
    const payload = event("evt_gap");
    const signature = await stubProviderSign(payload);
    for (const path of ["/v1/billing/webhook", "/v1/billing/webhooks", "/v1/billing/webhooks/stripe", "/v1/webhooks/stripe", "/v1/webhooks/billing", "/webhooks/stripe", "/v1/billing/events"]) {
      const response = await app.request(`http://localhost${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", "stripe-signature": `t=${Math.floor(Date.now() / 1000)},v1=${signature}` },
        body: payload,
      }, env);
      expect(response.status, path).toBe(404);
    }
  });

  it("does not refuse a replay: the same signed event verifies every time (verification is stateless)", async () => {
    const payload = event("evt_replay");
    const signature = await stubProviderSign(payload);
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await valid(await verify({ payload, signature, secret: SECRET })));
    expect(results).toEqual([true, true, true, true, true]);
    // and there is no tolerance window: a signature does not carry or check a timestamp
    const stale = JSON.stringify({ id: "evt_old", created: 1 });
    expect(await valid(await verify({ payload: stale, signature: await stubProviderSign(stale), secret: SECRET }))).toBe(true);
  });

  it("is an open oracle for any secret the caller brings: it proves nothing about OMDALA's own webhook secret", async () => {
    const payload = event("evt_oracle");
    const mine = "attacker-chosen-secret";
    expect(await valid(await verify({ payload, signature: await stubProviderSign(payload, mine), secret: mine }))).toBe(true);
    // no session needed
    expect((await verify({ payload, signature: "00", secret: mine })).status).toBe(200);
  });
});
