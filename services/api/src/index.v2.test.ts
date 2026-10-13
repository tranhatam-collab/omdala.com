import { describe, expect, it } from "vitest";
import app from "./index";

const env = {
  ENVIRONMENT: "test",
};

describe("v2/reality routes", () => {
  it("adds x-request-id and response meta.requestId", async () => {
    const response = await app.request(
      "http://localhost/v2/reality/health",
      {},
      env,
    );
    expect(response.status).toBe(200);

    const headerRequestId = response.headers.get("x-request-id");
    expect(headerRequestId).toBeTruthy();

    const json = (await response.json()) as {
      ok: boolean;
      meta?: { requestId?: string };
    };
    expect(json.ok).toBe(true);
    expect(json.meta?.requestId).toBeTruthy();
    expect(json.meta?.requestId).toBe(headerRequestId);
  });

  it("reuses inbound x-request-id", async () => {
    const requestId = "req_test_123";
    const response = await app.request(
      "http://localhost/v2/reality/trust",
      {
        headers: { "x-request-id": requestId },
      },
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe(requestId);

    const json = (await response.json()) as {
      ok: boolean;
      meta?: { requestId?: string };
    };
    expect(json.ok).toBe(true);
    expect(json.meta?.requestId).toBe(requestId);
  });

  it("returns standardized envelope for invalid JSON", async () => {
    const response = await app.request(
      "http://localhost/v2/reality/commitments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      },
      env,
    );

    expect(response.status).toBe(400);
    const json = (await response.json()) as {
      ok: boolean;
      error?: { code: string };
      meta?: { requestId?: string };
    };
    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("INVALID_JSON");
    expect(json.meta?.requestId).toBeTruthy();
  });

  it("validates commitment payload and returns 422 envelope", async () => {
    const response = await app.request(
      "http://localhost/v2/reality/commitments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromNodeId: "",
          toNodeId: "node_b",
          title: "invoice",
          summary: "",
        }),
      },
      env,
    );

    expect(response.status).toBe(422);
    const json = (await response.json()) as {
      ok: boolean;
      error?: { code: string };
    };
    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("INVALID_COMMITMENT");
  });

  it("writes commitment and proof then exposes trust update", async () => {
    const suffix = Date.now().toString(36);
    const fromNodeId = `node_from_${suffix}`;
    const toNodeId = `node_to_${suffix}`;

    const commitmentResponse = await app.request(
      "http://localhost/v2/reality/commitments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromNodeId,
          toNodeId,
          title: "smoke commitment",
          summary: "integration test",
          amount: 1000,
          currency: "VND",
        }),
      },
      env,
    );

    expect(commitmentResponse.status).toBe(201);
    const commitmentJson = (await commitmentResponse.json()) as {
      ok: boolean;
      data: { id: string };
    };
    expect(commitmentJson.ok).toBe(true);
    expect(commitmentJson.data.id).toBeTruthy();

    const proofResponse = await app.request(
      "http://localhost/v2/reality/proofs",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitmentId: commitmentJson.data.id,
          type: "payment",
          summary: "proof after commitment",
        }),
      },
      env,
    );

    expect(proofResponse.status).toBe(201);
    const trustResponse = await app.request(
      "http://localhost/v2/reality/trust",
      {},
      env,
    );
    expect(trustResponse.status).toBe(200);

    const trustJson = (await trustResponse.json()) as {
      ok: boolean;
      data: { trust: Array<{ nodeId: string; score: number }> };
    };
    expect(trustJson.ok).toBe(true);

    const fromTrust = trustJson.data.trust.find(
      (entry) => entry.nodeId === fromNodeId,
    );
    const toTrust = trustJson.data.trust.find(
      (entry) => entry.nodeId === toNodeId,
    );

    expect(fromTrust).toBeDefined();
    expect(toTrust).toBeDefined();
    expect((fromTrust?.score ?? 0) > 0).toBe(true);
    expect((toTrust?.score ?? 0) > 0).toBe(true);
  });

  it("returns 404 envelope for unknown trust node", async () => {
    const response = await app.request(
      "http://localhost/v2/reality/trust/node_missing_test",
      {},
      env,
    );

    expect(response.status).toBe(404);
    const json = (await response.json()) as {
      ok: boolean;
      error?: { code: string };
    };
    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("TRUST_NOT_FOUND");
  });
});
