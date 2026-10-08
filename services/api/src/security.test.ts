import { describe, expect, it } from "vitest";
import { resolveAllowedOrigin } from "./security";

const allowedOrigins = new Set([
  "https://omdala.com",
  "https://app-staging.omdala.com",
  "http://127.0.0.1:3000",
]);

describe("resolveAllowedOrigin", () => {
  it("accepts exact first-party origins", () => {
    expect(resolveAllowedOrigin("https://omdala.com", allowedOrigins)).toBe(
      "https://omdala.com",
    );
  });

  it("accepts an explicitly configured staging origin", () => {
    expect(
      resolveAllowedOrigin("https://app-staging.omdala.com", allowedOrigins),
    ).toBe("https://app-staging.omdala.com");
  });

  it("rejects unlisted subdomains and suffix-confusion domains", () => {
    expect(
      resolveAllowedOrigin("https://unknown.omdala.com", allowedOrigins),
    ).toBeNull();
    expect(
      resolveAllowedOrigin("https://evilomdala.com", allowedOrigins),
    ).toBeNull();
    expect(
      resolveAllowedOrigin(
        "https://app.omdala.com.evil.example",
        allowedOrigins,
      ),
    ).toBeNull();
  });

  it("rejects insecure subdomains", () => {
    expect(
      resolveAllowedOrigin("http://app.omdala.com", allowedOrigins),
    ).toBeNull();
  });

  it("rejects malformed origins", () => {
    expect(resolveAllowedOrigin("not-an-origin", allowedOrigins)).toBeNull();
  });
});
