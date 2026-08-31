import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRowsMock = vi.hoisted(() => vi.fn());

vi.mock("./client", () => ({
  queryRows: queryRowsMock,
}));

import {
  createProof,
  getTrustByNodeId,
  listNodes,
  listProofs,
  listTrust,
} from "./reality-repository";

type MaybeJson = unknown;

function normalizeExplanation(raw: MaybeJson): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item));
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      return [];
    }
  }

  return [];
}

describe("reality repository helpers", () => {
  beforeEach(() => {
    queryRowsMock.mockReset();
    queryRowsMock.mockResolvedValue([]);
  });

  it("parses trust explanation from JSON string", () => {
    const input = '["a","b"]';
    const result = normalizeExplanation(input);
    expect(result).toEqual(["a", "b"]);
  });

  it("returns empty array for invalid explanation JSON", () => {
    const result = normalizeExplanation("not-json");
    expect(result).toEqual([]);
  });

  it("returns mapped values for explanation arrays", () => {
    const result = normalizeExplanation([1, "x", true]);
    expect(result).toEqual(["1", "x", "true"]);
  });

  it("scopes node, proof, and trust lists to the authenticated owner", async () => {
    const env = { ENVIRONMENT: "test", DATABASE_URL: "postgres://test" };
    const ownerEmail = "owner@omdala.com";

    await listNodes(env, ownerEmail);
    await listProofs(env, ownerEmail);
    await listTrust(env, ownerEmail);

    expect(queryRowsMock).toHaveBeenNthCalledWith(
      1,
      env,
      expect.stringContaining("WHERE owner_email = $1"),
      [ownerEmail],
    );
    expect(queryRowsMock).toHaveBeenNthCalledWith(
      2,
      env,
      expect.stringContaining("WHERE owner_email = $1"),
      [ownerEmail],
    );
    expect(queryRowsMock).toHaveBeenNthCalledWith(
      3,
      env,
      expect.stringContaining("n.owner_email = $1"),
      [ownerEmail],
    );
  });

  it("scopes a trust lookup to both node and authenticated owner", async () => {
    const env = { ENVIRONMENT: "test", DATABASE_URL: "postgres://test" };
    await getTrustByNodeId(env, "owner@omdala.com", "node_1");

    expect(queryRowsMock).toHaveBeenCalledWith(
      env,
      expect.stringContaining("n.owner_email = $2"),
      ["node_1", "owner@omdala.com"],
    );
  });

  it("stores proof ownership with every persistent proof", async () => {
    const env = { ENVIRONMENT: "test", DATABASE_URL: "postgres://test" };
    queryRowsMock.mockResolvedValueOnce([
      {
        id: "proof_1",
        proof_type: "document",
        summary: "Owned proof",
        verification_status: "pending",
        created_at: "2026-08-30T00:00:00.000Z",
      },
    ]);

    await createProof(env, "owner@omdala.com", {
      type: "document",
      summary: "Owned proof",
    });

    expect(queryRowsMock).toHaveBeenCalledWith(
      env,
      expect.stringContaining("owner_email"),
      expect.arrayContaining(["owner@omdala.com"]),
    );
    expect(queryRowsMock.mock.calls[0]?.[2]?.[1]).toBe("owner@omdala.com");
  });
});
