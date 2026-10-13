import { describe, expect, it } from "vitest";

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
});
