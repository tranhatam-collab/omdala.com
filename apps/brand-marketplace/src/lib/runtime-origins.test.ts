import { afterEach, describe, expect, it } from "vitest";
import { getAppWorkspaceOrigin } from "./runtime-origins";

const originalOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN;

afterEach(() => {
  if (originalOrigin === undefined) {
    delete process.env.NEXT_PUBLIC_APP_ORIGIN;
  } else {
    process.env.NEXT_PUBLIC_APP_ORIGIN = originalOrigin;
  }
});

describe("getAppWorkspaceOrigin", () => {
  it("uses the production App origin by default", () => {
    delete process.env.NEXT_PUBLIC_APP_ORIGIN;
    expect(getAppWorkspaceOrigin()).toBe("https://app.omdala.com");
  });

  it("accepts an HTTPS staging origin and removes its path", () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN =
      "https://staging-app.omdala.com/workspace?source=brand";
    expect(getAppWorkspaceOrigin()).toBe("https://staging-app.omdala.com");
  });

  it("accepts loopback HTTP for local E2E", () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN = "http://127.0.0.1:3011/workspace";
    expect(getAppWorkspaceOrigin()).toBe("http://127.0.0.1:3011");
  });

  it("fails closed for insecure or malformed origins", () => {
    for (const origin of [
      "http://example.com",
      "javascript:alert(1)",
      "invalid",
    ]) {
      process.env.NEXT_PUBLIC_APP_ORIGIN = origin;
      expect(getAppWorkspaceOrigin()).toBe("https://app.omdala.com");
    }
  });
});
