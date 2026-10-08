import { describe, expect, it } from "vitest";
import {
  API_CONTRACT_VERSION,
  normalizeIdempotencyKey,
  parsePaginationParams,
} from "./contracts";

describe("versioned API contract helpers", () => {
  it("publishes the current contract version", () => {
    expect(API_CONTRACT_VERSION).toBe("2026-10-07");
  });

  it("normalizes pagination and caps page size", () => {
    expect(parsePaginationParams({ page: "2", limit: "1000" })).toEqual({
      page: 2,
      limit: 100,
    });
    expect(parsePaginationParams({ page: "-1", limit: "nan" })).toEqual({
      page: 1,
      limit: 20,
    });
  });

  it("accepts safe idempotency keys and rejects ambiguous values", () => {
    expect(normalizeIdempotencyKey(" checkout_2026.10:1 ")).toBe(
      "checkout_2026.10:1",
    );
    expect(normalizeIdempotencyKey("key with spaces")).toBeUndefined();
    expect(normalizeIdempotencyKey("x".repeat(129))).toBeUndefined();
  });
});
