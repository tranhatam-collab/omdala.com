import { afterEach, describe, expect, it } from "vitest";
import { getAppWorkspaceOrigin } from "./runtime-origins";

const originalOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN;
const originalEnvironment = process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT;

afterEach(() => {
  if (originalOrigin === undefined) {
    delete process.env.NEXT_PUBLIC_APP_ORIGIN;
  } else {
    process.env.NEXT_PUBLIC_APP_ORIGIN = originalOrigin;
  }
  if (originalEnvironment === undefined) {
    delete process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT;
  } else {
    process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT = originalEnvironment;
  }
});

describe("getAppWorkspaceOrigin", () => {
  it("uses the production App origin by default", () => {
    delete process.env.NEXT_PUBLIC_APP_ORIGIN;
    expect(getAppWorkspaceOrigin()).toBe("https://app.omdala.com");
  });

  it("accepts only the canonical staging App origin", () => {
    process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT = "staging";
    process.env.NEXT_PUBLIC_APP_ORIGIN = "https://app-staging.omdala.com";
    expect(getAppWorkspaceOrigin()).toBe("https://app-staging.omdala.com");
  });

  it("accepts loopback HTTP for local E2E", () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN = "http://127.0.0.1:3011/workspace";
    expect(getAppWorkspaceOrigin()).toBe("http://127.0.0.1:3011");
  });

  it("fails closed for insecure, malformed, or lookalike protected origins", () => {
    process.env.NEXT_PUBLIC_RELEASE_ENVIRONMENT = "staging";
    for (const origin of [
      "http://example.com",
      "javascript:alert(1)",
      "invalid",
      "https://app-staging.omdala.com.evil.example",
      "https://app.omdala.com",
    ]) {
      process.env.NEXT_PUBLIC_APP_ORIGIN = origin;
      expect(() => getAppWorkspaceOrigin()).toThrow();
    }
  });
});
