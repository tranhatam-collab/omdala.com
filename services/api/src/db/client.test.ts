import { beforeEach, describe, expect, it, vi } from "vitest";

const clientMock = vi.hoisted(() => ({
  options: [] as unknown[],
  connect: vi.fn(async () => undefined),
  query: vi.fn(async () => ({ rows: [{ ok: 1 }] })),
  end: vi.fn(async () => undefined),
}));

vi.mock("pg", () => ({
  Client: class {
    constructor(options: unknown) {
      clientMock.options.push(options);
    }
    connect = clientMock.connect;
    query = clientMock.query;
    end = clientMock.end;
  },
}));

import type { ApiBindings } from "../contracts";
import { queryRows, resolveDbSsl } from "./client";

const base = { DATABASE_URL: "postgres://db.example/omdala" };
const env = (extra: Partial<ApiBindings>) => ({ ...base, ...extra }) as ApiBindings;

describe("PostgreSQL TLS policy", () => {
  beforeEach(() => {
    clientMock.options.length = 0;
    clientMock.connect.mockClear();
  });

  it.each(["production", "staging", "test", "development", "local", ""])(
    "verifies certificates by default in %j",
    (environment) => {
      expect(resolveDbSsl(env({ ENVIRONMENT: environment }))).toEqual({ rejectUnauthorized: true });
    },
  );

  it.each(["0", "true", "yes", "", " 1"])("ignores a non-exact flag value %j", (flag) => {
    expect(
      resolveDbSsl(env({ ENVIRONMENT: "test", OMDALA_DB_TLS_INSECURE: flag })),
    ).toEqual({ rejectUnauthorized: true });
  });

  it.each(["local", "development", "test", "TEST"])(
    "honors the explicit flag in %s",
    (environment) => {
      expect(
        resolveDbSsl(env({ ENVIRONMENT: environment, OMDALA_DB_TLS_INSECURE: "1" })),
      ).toEqual({ rejectUnauthorized: false });
    },
  );

  it.each(["production", "staging", "", "preview"])(
    "refuses the flag in %j",
    (environment) => {
      expect(() =>
        resolveDbSsl(env({ ENVIRONMENT: environment, OMDALA_DB_TLS_INSECURE: "1" })),
      ).toThrow("DB_TLS_INSECURE_REFUSED");
    },
  );

  it("queryRows connects with verification on by default", async () => {
    await queryRows(env({ ENVIRONMENT: "production" }), "SELECT 1");
    expect(clientMock.options[0]).toMatchObject({ ssl: { rejectUnauthorized: true } });
  });

  it("queryRows never opens a connection when the flag is refused", async () => {
    await expect(
      queryRows(env({ ENVIRONMENT: "production", OMDALA_DB_TLS_INSECURE: "1" }), "SELECT 1"),
    ).rejects.toThrow("DB_TLS_INSECURE_REFUSED");
    expect(clientMock.options).toHaveLength(0);
    expect(clientMock.connect).not.toHaveBeenCalled();
  });
});
