import { describe, expect, it } from "vitest";
import { mapDbErrorToHttp, toDbQueryError } from "./errors";

describe("db error mapping", () => {
  it("maps SQLSTATE 57014 to DATABASE_TIMEOUT", () => {
    const error = {
      code: "57014",
      message: "canceling statement due to statement timeout",
    };
    const mapped = mapDbErrorToHttp(error);

    expect(mapped.status).toBe(504);
    expect(mapped.errorCode).toBe("DATABASE_TIMEOUT");
  });

  it("maps SQLSTATE 08006 to DATABASE_UNAVAILABLE", () => {
    const error = { code: "08006", message: "connection failure" };
    const mapped = mapDbErrorToHttp(error);

    expect(mapped.status).toBe(502);
    expect(mapped.errorCode).toBe("DATABASE_UNAVAILABLE");
  });

  it("maps SQLSTATE 23503 to DATABASE_CONSTRAINT_FOREIGN_KEY", () => {
    const error = {
      code: "23503",
      message: "insert or update violates foreign key constraint",
    };
    const mapped = mapDbErrorToHttp(error);

    expect(mapped.status).toBe(422);
    expect(mapped.errorCode).toBe("DATABASE_CONSTRAINT_FOREIGN_KEY");
  });

  it("attaches operation context in DbQueryError", () => {
    const error = new Error("ECONNREFUSED");
    const mapped = toDbQueryError(error, "listNodes");

    expect(mapped.operation).toBe("listNodes");
    expect(mapped.kind).toBe("unavailable");
  });
});
