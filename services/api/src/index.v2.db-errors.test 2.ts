import { beforeEach, describe, expect, it, vi } from "vitest";
import { DbQueryError } from "./db/errors";

const env = {
  ENVIRONMENT: "test",
  DATABASE_URL: "postgres://example.local/db",
};

describe("v2/reality database error envelope", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 504 DATABASE_TIMEOUT when DB query times out", async () => {
    vi.doMock("./db/reality-repository", async () => {
      const actual = await vi.importActual<
        typeof import("./db/reality-repository")
      >("./db/reality-repository");
      return {
        ...actual,
        listNodes: vi.fn(async () => {
          throw new DbQueryError({
            kind: "timeout",
            message: "statement timeout",
            sqlState: "57014",
            operation: "listNodes",
          });
        }),
      };
    });

    const module = await import("./index");
    const app = module.default;

    const response = await app.request(
      "http://localhost/v2/reality/nodes",
      {},
      env,
    );
    expect(response.status).toBe(504);

    const json = (await response.json()) as {
      ok: boolean;
      error?: { code: string; message: string };
    };
    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("DATABASE_TIMEOUT");
    expect(json.error?.message).toBe("Database request timed out");
  });

  it("returns 502 DATABASE_UNAVAILABLE when DB connection fails", async () => {
    vi.doMock("./db/reality-repository", async () => {
      const actual = await vi.importActual<
        typeof import("./db/reality-repository")
      >("./db/reality-repository");
      return {
        ...actual,
        listTrust: vi.fn(async () => {
          throw new DbQueryError({
            kind: "unavailable",
            message: "ECONNREFUSED",
            sqlState: "08006",
            operation: "listTrust",
          });
        }),
      };
    });

    const module = await import("./index");
    const app = module.default;

    const response = await app.request(
      "http://localhost/v2/reality/trust",
      {},
      env,
    );
    expect(response.status).toBe(502);

    const json = (await response.json()) as {
      ok: boolean;
      error?: { code: string; message: string };
    };
    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("DATABASE_UNAVAILABLE");
    expect(json.error?.message).toBe("Database connection unavailable");
  });

  it("returns 500 INTERNAL_ERROR on non-db unknown handler error", async () => {
    vi.doMock("./db/reality-repository", async () => {
      const actual = await vi.importActual<
        typeof import("./db/reality-repository")
      >("./db/reality-repository");
      return {
        ...actual,
        createCommitment: vi.fn(async () => {
          throw new Error("foreign key violation");
        }),
      };
    });

    const module = await import("./index");
    const app = module.default;

    const response = await app.request(
      "http://localhost/v2/reality/commitments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromNodeId: "node_missing_a",
          toNodeId: "node_missing_b",
          title: "fk test",
          summary: "fk test summary",
        }),
      },
      env,
    );

    expect(response.status).toBe(500);

    const json = (await response.json()) as {
      ok: boolean;
      error?: { code: string; message: string };
    };

    expect(json.ok).toBe(false);
    expect(json.error?.code).toBe("INTERNAL_ERROR");
    expect(json.error?.message).toBe("Unexpected server error");
  });
});
